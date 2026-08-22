import { NextRequest } from "next/server";
import { getDb, Listing } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const id = req.nextUrl.searchParams.get("id");
  const to = req.nextUrl.searchParams.get("to");
  const referrer = req.headers.get("referer") || null;

  let listing: Listing | undefined;

  if (id && /^\d+$/.test(id)) {
    listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(Number(id)) as
      | Listing
      | undefined;
  } else if (to) {
    const clean = to.replace(/\/$/, "");
    listing = db
      .prepare("SELECT * FROM listings WHERE url = ? OR url = ? LIMIT 1")
      .get(clean, `${clean}/`) as Listing | undefined;
  }

  if (!listing) {
    return new Response("Not found", { status: 404 });
  }

  const now = new Date().toISOString();
  db.prepare(
    "UPDATE listings SET clicks = clicks + 1, clicks_this_hour = clicks_this_hour + 1 WHERE id = ?"
  ).run(listing.id);
  db.prepare(
    "INSERT INTO click_events (listing_id, created_at, referrer) VALUES (?, ?, ?)"
  ).run(listing.id, now, referrer);

  const destination = new URL(listing.url);
  destination.searchParams.set("utm_source", "rankrival");

  return Response.redirect(destination, 302);
}
