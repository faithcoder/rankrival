import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validVisitorId, voterHash, VOTER_COOKIE } from "@/lib/upvotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "Cross-site voting is not allowed" }, { status: 403 });
  }

  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const attempt = attempts.get(client);
  if (attempt && attempt.reset > now && attempt.count >= 30) {
    return NextResponse.json({ error: "Too many votes. Please wait a minute." }, { status: 429 });
  }
  attempts.set(client, attempt && attempt.reset > now
    ? { ...attempt, count: attempt.count + 1 }
    : { count: 1, reset: now + 60_000 });

  let listingId: number;
  try {
    const body = await req.json();
    listingId = Number(body.listingId);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Number.isInteger(listingId) || listingId < 1) {
    return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  }

  const db = getDb();
  const listing = db.prepare("SELECT id FROM listings WHERE id = ? AND paid = 1").get(listingId);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const existingCookie = req.cookies.get(VOTER_COOKIE)?.value;
  const visitorId = validVisitorId(existingCookie) ? existingCookie : randomUUID();
  const hash = voterHash(visitorId);

  const result = db.transaction(() => {
    const existing = db.prepare(
      "SELECT id FROM listing_upvotes WHERE listing_id = ? AND voter_hash = ?"
    ).get(listingId, hash) as { id: number } | undefined;
    if (existing) {
      db.prepare("DELETE FROM listing_upvotes WHERE id = ?").run(existing.id);
    } else {
      db.prepare(
        "INSERT INTO listing_upvotes (listing_id, voter_hash, created_at) VALUES (?, ?, ?)"
      ).run(listingId, hash, new Date().toISOString());
    }
    const count = (db.prepare(
      "SELECT COUNT(*) AS count FROM listing_upvotes WHERE listing_id = ?"
    ).get(listingId) as { count: number }).count;
    return { has_upvoted: !existing, upvotes: count };
  })();

  const response = NextResponse.json(result);
  if (!validVisitorId(existingCookie)) {
    response.cookies.set(VOTER_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
