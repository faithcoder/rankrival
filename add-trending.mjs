import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "bidboard.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "trending.json"), "utf-8"));

// Get current max bid to place trending products at the top
const maxBid = db.prepare("SELECT MAX(bid_amount) as m FROM listings WHERE paid = 1").get();
const startBid = maxBid ? maxBid.m + 500 : 5000;

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

let added = 0;

const insertAll = db.transaction(() => {
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let domain;
    try {
      domain = new URL(p.url).hostname.replace("www.", "");
    } catch {
      console.log(`Skipping invalid URL: ${p.url}`);
      continue;
    }

    // Check if already exists
    const existing = db.prepare("SELECT id FROM listings WHERE domain = ?").get(domain);
    if (existing) {
      console.log(`Skipping ${domain} — already exists`);
      continue;
    }

    // Trending products get high bids, decreasing by rank
    const bid = startBid - i * 100;
    const clicks = Math.floor(bid * (10 + Math.random() * 15));
    const cph = Math.max(5, Math.floor(clicks / (12 + Math.random() * 24)));
    const minsAgo = Math.floor(Math.random() * 48 * 60); // 0-2 days

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
    added++;
  }

  // Recalculate all ranks
  const rows = db
    .prepare("SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC")
    .all();

  const updateRank = db.prepare("UPDATE listings SET rank = ? WHERE id = ?");
  rows.forEach((row, i) => updateRank.run(i + 1, row.id));

  // Update site stats
  const totalRevenue = db.prepare("SELECT SUM(bid_amount) as s FROM listings WHERE paid = 1").get();
  db.prepare("UPDATE site_stats SET total_revenue = ?, updated_at = ? WHERE id = 1")
    .run(totalRevenue.s, new Date().toISOString());
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings WHERE paid = 1").get();
console.log(`Added ${added} trending products. Total listings: ${count.c}`);

db.close();
