import { NextRequest } from "next/server";
import { getDb, resetHourlyClicksIfNeeded, finalizePayment, finalizeFreeListing, recalculateRanks, Listing } from "@/lib/db";
import { isMockMode, createCheckoutSession } from "@/lib/stripe";
import { normalizeUrl, extractDomain, validatePublicListingUrl } from "@/lib/utils";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { isFreeListingActive } from "@/lib/promotion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_BID = 500; // $5.00
const MAX_BID = 99_999_900; // $999,999.00
const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const nowMs = Date.now();
  const attempt = attempts.get(client);
  if (attempt && attempt.reset > nowMs && attempt.count >= 10) return Response.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  attempts.set(client, attempt && attempt.reset > nowMs ? { ...attempt, count: attempt.count + 1 } : { count: 1, reset: nowMs + 60_000 });
  let body: { url?: string; amount?: number; description?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? normalizeUrl(body.url) : "";
  const amount = Number(body.amount);
  const requestedCategory = typeof body.category === "string" ? body.category : "";

  if (!url || url.length > 2048 || !/^https?:\/\/[^\s]+/.test(url)) {
    return Response.json({ error: "Please enter a valid URL" }, { status: 400 });
  }
  const urlError = validatePublicListingUrl(url);
  if (urlError) return Response.json({ error: urlError }, { status: 400 });

  if (!Number.isInteger(amount) || amount < MIN_BID || amount > MAX_BID) {
    return Response.json(
      { error: "Bid must be between $5 and $999,999" },
      { status: 400 }
    );
  }

  if (amount % 100 !== 0) {
    return Response.json({ error: "Bids must use $1 increments" }, { status: 400 });
  }

  if (!CATEGORY_SLUGS.has(requestedCategory)) {
    return Response.json({ error: "Please select a valid category" }, { status: 400 });
  }

  const domain = extractDomain(url);
  const db = getDb();
  resetHourlyClicksIfNeeded(db);

  const pathKeyedHosts = new Set(["github.com", "apps.apple.com", "play.google.com", "x.com", "twitter.com"]);
  const identityColumn = pathKeyedHosts.has(domain) ? "url" : "domain";
  const identityValue = identityColumn === "url" ? url : domain;
  const identityListings = db.prepare(`SELECT * FROM listings WHERE ${identityColumn} = ? ORDER BY paid DESC, updated_at DESC`).all(identityValue) as Listing[];
  const existing = identityListings.find((listing) => listing.paid === 1);
  const freeListing = isFreeListingActive();
  const effectiveAmount = amount;
  const effectiveCategory = existing?.category || requestedCategory;
  const pending = identityListings.find((listing) => listing.paid === 0);
  if (pending) {
    const isFresh = Date.now() - new Date(pending.updated_at).getTime() < 30 * 60 * 1000;
    if (isFresh) return Response.json({ error: "An update is already pending for this listing. Please try again later." }, { status: 409 });
    db.prepare("DELETE FROM listings WHERE id = ? AND paid = 0").run(pending.id);
  }

  const currentTop = db.prepare(
    "SELECT * FROM listings WHERE paid = 1 AND category = ? AND id != ? ORDER BY bid_amount DESC, created_at ASC LIMIT 1"
  ).get(effectiveCategory, existing?.id ?? -1) as Listing | undefined;
  if (currentTop && effectiveAmount > currentTop.bid_amount && effectiveAmount < currentTop.bid_amount + 500) {
    return Response.json({ error: `To claim #1 you must outbid ${currentTop.domain} by at least $5 ($${(currentTop.bid_amount + 500) / 100})` }, { status: 400 });
  }

  let listingId: number;
  let chargeAmount: number;
  let previousAmount: number;
  const now = new Date().toISOString();

  if (existing) {
    if (existing.bid_amount >= effectiveAmount) {
      return Response.json(
        { error: "Your new bid must be higher than your current bid" },
        { status: 400 }
      );
    }
    previousAmount = existing.bid_amount;
    chargeAmount = effectiveAmount - existing.bid_amount;
    listingId = existing.id;
  } else {
    previousAmount = 0;
    chargeAmount = effectiveAmount;

    const info = db
      .prepare(
        `INSERT INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, category, paid)
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, 0)`
      )
      .run(
        url,
        domain,
        domain.split(".")[0],
        body.description && typeof body.description === "string" ? body.description.trim().slice(0, 240) : null,
        effectiveAmount,
        now,
        now,
        effectiveCategory
      );
    listingId = Number(info.lastInsertRowid);
  }

  if (freeListing) {
    if (!finalizeFreeListing(db, listingId, effectiveAmount, previousAmount)) {
      db.prepare("DELETE FROM listings WHERE id = ? AND paid = 0").run(listingId);
      return Response.json({ error: "Unable to activate the free listing" }, { status: 500 });
    }
    recalculateRanks(db);
    return Response.json({
      free: true,
      url: `/success?free=1&id=${listingId}&domain=${encodeURIComponent(domain)}&amount=${effectiveAmount}`,
    });
  }

  if (isMockMode()) {
    finalizePayment(db, listingId, effectiveAmount, previousAmount);
    recalculateRanks(db);
    return Response.json({
      mock: true,
      url: `/success?session_id=mock_${listingId}&domain=${encodeURIComponent(
        domain
      )}&amount=${effectiveAmount}`,
    });
  }

  try {
    const session = await createCheckoutSession({
      listingId,
      domain,
      chargeAmount,
      fullAmount: effectiveAmount,
      previousAmount,
    });
    db.prepare("UPDATE listings SET stripe_session_id = ? WHERE id = ?").run(
      session.id,
      listingId
    );
    return Response.json({ url: session.url });
  } catch {
    if (previousAmount === 0) db.prepare("DELETE FROM listings WHERE id = ? AND paid = 0").run(listingId);
    return Response.json(
      { error: "Payment setup failed. Please try again." },
      { status: 500 }
    );
  }
}
