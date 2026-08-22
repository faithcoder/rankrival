import { getDb, resetHourlyClicksIfNeeded } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  resetHourlyClicksIfNeeded(db);

  const trending = db
    .prepare(
      `SELECT id, url, domain, handle, bid_amount, clicks, clicks_this_hour, rank
       FROM listings
       WHERE paid = 1 AND clicks_this_hour > 0
       ORDER BY clicks_this_hour DESC, bid_amount DESC
       LIMIT 5`
    )
    .all();

  return Response.json({ trending });
}
