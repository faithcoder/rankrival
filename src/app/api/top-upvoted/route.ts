import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const upvoted = db.prepare(
    `SELECT l.id, l.url, l.domain, l.handle, l.bid_amount, l.rank,
            COUNT(u.id) AS upvotes,
            SUM(CASE
              WHEN u.created_at >= datetime('now', '-1 hour') THEN 5.0
              WHEN u.created_at >= datetime('now', '-1 day') THEN 2.0
              ELSE 0.1
            END) AS vote_score
     FROM listings l
     JOIN listing_upvotes u ON u.listing_id = l.id
     WHERE l.paid = 1
     GROUP BY l.id
     ORDER BY vote_score DESC, upvotes DESC, l.bid_amount DESC
     LIMIT 5`
  ).all();

  return Response.json({ upvoted });
}
