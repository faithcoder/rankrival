import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "rankrival.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Clear existing data
db.prepare("DELETE FROM bid_events").run();
db.prepare("DELETE FROM click_events").run();
db.prepare("DELETE FROM listings").run();
db.prepare("DELETE FROM site_stats").run();
db.prepare("DELETE FROM meta").run();

const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "products.json"), "utf-8"));

const now = Date.now();
const mins = 60_000;
const hour = 60 * mins;

const insert = db.prepare(`
  INSERT INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid)
  VALUES (@url, @domain, @handle, @description, @bid, @clicks, @cph, 0, @created_at, @updated_at, 1)
`);

const insertEvent = db.prepare(`
  INSERT INTO bid_events (listing_id, amount, previous_amount, created_at)
  VALUES (?, ?, ?, ?)
`);

let totalRevenue = 0;

const insertAll = db.transaction(() => {
  // Assign bids: top products get higher bids, rest get $5-$25
  const bidTiers = [
    { count: 3, min: 3000, max: 5000 },   // Top 3
    { count: 5, min: 1500, max: 2999 },   // Top 4-8
    { count: 10, min: 500, max: 1499 },   // Top 9-18
    { count: 20, min: 100, max: 499 },    // Top 19-38
    { count: 25, min: 25, max: 99 },      // Mid tier
    { count: 999, min: 5, max: 24 },      // Everyone else
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const domain = new URL(p.url).hostname.replace("www.", "");

    // Find bid tier
    let bid = 5;
    let cumCount = 0;
    for (const tier of bidTiers) {
      cumCount += tier.count;
      if (i < cumCount) {
        bid = Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
        break;
      }
    }

    // Clicks scale with bid
    const clicks = Math.floor(bid * (8 + Math.random() * 12));
    const cph = Math.max(1, Math.floor(clicks / (24 + Math.random() * 48)));
    const minsAgo = Math.floor(Math.random() * 7 * 24 * 60); // 0-7 days

    const created = new Date(now - minsAgo * mins).toISOString();

    const info = insert.run({
      url: p.url,
      domain: domain,
      handle: null,
      description: p.description,
      bid: bid,
      clicks: clicks,
      cph: cph,
      created_at: created,
      updated_at: created,
    });

    const id = Number(info.lastInsertRowid);
    insertEvent.run(id, bid, 0, created);
    totalRevenue += bid;
  }

  // Recalculate ranks
  const rows = db
    .prepare("SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC")
    .all();

  const updateRank = db.prepare("UPDATE listings SET rank = ? WHERE id = ?");
  rows.forEach((row, i) => updateRank.run(i + 1, row.id));

  // Insert site stats
  db.prepare(
    "INSERT INTO site_stats (total_visitors, total_revenue, updated_at) VALUES (?, ?, ?)"
  ).run(147392 + Math.floor(Math.random() * 50000), totalRevenue, new Date().toISOString());
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings").get();
const stats = db.prepare("SELECT * FROM site_stats ORDER BY id DESC LIMIT 1").get();
console.log(`Seeded ${count.c} listings. Total revenue: $${stats.total_revenue}`);

db.close();
