import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "bidboard.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Clear and start fresh
db.prepare("DELETE FROM bid_events").run();
db.prepare("DELETE FROM click_events").run();
db.prepare("DELETE FROM listings").run();
db.prepare("DELETE FROM site_stats").run();
db.prepare("DELETE FROM meta").run();

// Load both product lists
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "products.json"), "utf-8"));
const trending = JSON.parse(fs.readFileSync(path.join(process.cwd(), "trending.json"), "utf-8"));

// Merge: trending first (higher bids), then original products
const allProducts = [...trending, ...products];

// Deduplicate by domain
const seen = new Set();
const unique = [];
for (const p of allProducts) {
  let domain;
  try { domain = new URL(p.url).hostname.replace("www.", ""); } catch { continue; }
  if (seen.has(domain)) continue;
  seen.add(domain);
  unique.push({ ...p, domain });
}

const now = Date.now();
const mins = 60_000;

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
  for (let i = 0; i < unique.length; i++) {
    const p = unique[i];

    // Bid tiers: trending products get higher bids
    let bid;
    if (i < trending.length) {
      // Trending: $2000-$8000
      bid = 8000 - i * 200;
      if (bid < 2000) bid = 2000;
    } else {
      // Original products: tiered bids
      const idx = i - trending.length;
      if (idx < 3) bid = 3000 + Math.floor(Math.random() * 2000);
      else if (idx < 8) bid = 1500 + Math.floor(Math.random() * 1499);
      else if (idx < 18) bid = 500 + Math.floor(Math.random() * 999);
      else if (idx < 38) bid = 100 + Math.floor(Math.random() * 399);
      else if (idx < 63) bid = 25 + Math.floor(Math.random() * 74);
      else bid = 5 + Math.floor(Math.random() * 19);
    }

    const clicks = Math.floor(bid * (8 + Math.random() * 12));
    const cph = Math.max(1, Math.floor(clicks / (24 + Math.random() * 48)));
    const minsAgo = Math.floor(Math.random() * 7 * 24 * 60);

    const created = new Date(now - minsAgo * mins).toISOString();

    const info = insert.run({
      url: p.url,
      domain: p.domain,
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
  ).run(196445, totalRevenue, new Date().toISOString());
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings WHERE paid = 1").get();
const stats = db.prepare("SELECT * FROM site_stats ORDER BY id DESC LIMIT 1").get();
console.log(`Total listings: ${count.c}`);
console.log(`Total revenue: $${stats.total_revenue}`);
console.log(`Trending products: ${trending.length}`);
console.log(`Original products: ${count.c - trending.length}`);

db.close();
