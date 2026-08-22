import { getDb, getSiteStats } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const stats = getSiteStats(db);

  const listingCount = db
    .prepare("SELECT COUNT(*) as c FROM listings WHERE paid = 1")
    .get() as { c: number };

  const totalClicks = db
    .prepare("SELECT COALESCE(SUM(clicks), 0) as c FROM listings WHERE paid = 1")
    .get() as { c: number };

  const highestBid = db.prepare(
    "SELECT domain, bid_amount FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC LIMIT 1"
  ).get() as { domain: string; bid_amount: number } | undefined;

  const hourlyRows = db.prepare(
    `SELECT substr(created_at, 1, 13) hour, COUNT(*) clicks
     FROM click_events
     WHERE created_at >= ?
     GROUP BY hour ORDER BY hour ASC`
  ).all(new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()) as { hour: string; clicks: number }[];
  const hourlyMap = new Map(hourlyRows.map((row) => [row.hour, row.clicks]));
  const hourlyClicks = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(Date.now() - (23 - index) * 60 * 60 * 1000);
    const hour = date.toISOString().slice(0, 13);
    return { hour: date.toISOString(), clicks: hourlyMap.get(hour) ?? 0 };
  });

  const topListings = db.prepare(
    `SELECT id, domain, rank, clicks, clicks_this_hour
     FROM listings WHERE paid = 1 ORDER BY clicks DESC LIMIT 8`
  ).all();

  const rawReferrers = db.prepare(
    `SELECT referrer, COUNT(*) clicks FROM click_events
     GROUP BY referrer ORDER BY clicks DESC LIMIT 30`
  ).all() as { referrer: string | null; clicks: number }[];
  const referrerTotals = new Map<string, number>();
  for (const row of rawReferrers) {
    let name = "Direct";
    if (row.referrer) {
      try { name = new URL(row.referrer).hostname.replace(/^www\./, ""); } catch { name = "Other"; }
    }
    referrerTotals.set(name, (referrerTotals.get(name) ?? 0) + row.clicks);
  }
  const referrers = [...referrerTotals.entries()]
    .map(([source, clicks]) => ({ source, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  return Response.json({
    total_visitors: stats.total_visitors,
    total_revenue: stats.total_revenue,
    total_listings: listingCount.c,
    total_clicks: totalClicks.c,
    highest_bid: highestBid ?? null,
    clicks_last_24h: hourlyClicks.reduce((sum, point) => sum + point.clicks, 0),
    hourly_clicks: hourlyClicks,
    top_listings: topListings,
    referrers,
    updated_at: stats.updated_at,
  });
}
