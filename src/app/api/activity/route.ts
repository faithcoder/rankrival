import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const activity = db
    .prepare(
      `SELECT be.id, be.amount, be.previous_amount, be.created_at, l.domain, l.url, l.rank
       FROM bid_events be
       JOIN listings l ON l.id = be.listing_id
       ORDER BY be.id DESC
       LIMIT 5`
    )
    .all();

  return Response.json({ activity });
}
