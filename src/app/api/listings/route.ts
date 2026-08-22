import { getDb, resetHourlyClicksIfNeeded } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  resetHourlyClicksIfNeeded(db);

  const listings = db
    .prepare(
      `SELECT id, url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid
       FROM listings
       WHERE paid = 1
       ORDER BY rank ASC`
    )
    .all();

  return Response.json({ listings });
}
