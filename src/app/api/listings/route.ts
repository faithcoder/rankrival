import { NextRequest } from "next/server";
import { getDb, resetHourlyClicksIfNeeded } from "@/lib/db";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { validVisitorId, voterHash, VOTER_COOKIE } from "@/lib/upvotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  resetHourlyClicksIfNeeded(db);

  const requestedCategory = req.nextUrl.searchParams.get("category");
  const category = requestedCategory && CATEGORY_SLUGS.has(requestedCategory)
    ? requestedCategory
    : null;

  const rows = db
    .prepare(
      `SELECT id, url, domain, handle, description, bid_amount, clicks, clicks_this_hour, created_at, updated_at, paid, category
       FROM listings
       WHERE paid = 1 ${category ? "AND category = ?" : ""}
       ORDER BY bid_amount DESC, created_at ASC`
    )
    .all(...(category ? [category] : [])) as Array<Record<string, unknown> & { id: number }>;

  const listings = rows.map((listing, index) => ({ ...listing, rank: index + 1 }));
  const categoryRows = db.prepare(
    "SELECT category, COUNT(*) AS count FROM listings WHERE paid = 1 GROUP BY category"
  ).all() as { category: string; count: number }[];
  const category_counts = Object.fromEntries(categoryRows.map((row) => [row.category, row.count]));

  const upvoteRows = db.prepare(
    "SELECT listing_id, COUNT(*) AS count FROM listing_upvotes GROUP BY listing_id"
  ).all() as { listing_id: number; count: number }[];
  const upvoteCounts = new Map(upvoteRows.map((row) => [row.listing_id, row.count]));
  const visitorId = req.cookies.get(VOTER_COOKIE)?.value;
  const votedIds = validVisitorId(visitorId)
    ? new Set((db.prepare(
        "SELECT listing_id FROM listing_upvotes WHERE voter_hash = ?"
      ).all(voterHash(visitorId)) as { listing_id: number }[]).map((row) => row.listing_id))
    : new Set<number>();

  const listingsWithVotes = listings.map((listing) => ({
    ...listing,
    upvotes: upvoteCounts.get(Number(listing.id)) ?? 0,
    has_upvoted: votedIds.has(Number(listing.id)),
  }));

  return Response.json({ listings: listingsWithVotes, category_counts });
}
