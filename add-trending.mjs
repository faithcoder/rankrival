import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "rankrival.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Load all trending JSON files
const files = ["trending1.json", "trending2.json", "trending3.json"];
let products = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), f), "utf-8"));
  products.push(...data);
}

// Get existing URLs to avoid duplicates
const existing = db.prepare("SELECT url FROM listings").all().map(r => r.url);
const newProducts = products.filter(p => !existing.includes(p.url));

console.log(`Found ${newProducts.length} new products to add (${products.length - newProducts.length} duplicates skipped)`);

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
  for (const p of newProducts) {
    const domain = new URL(p.url).hostname.replace("www.", "");
    const bid = Math.floor(Math.random() * 45) + 5; // $5-$49
    const clicks = Math.floor(bid * (6 + Math.random() * 10));
    const cph = Math.max(1, Math.floor(clicks / (24 + Math.random() * 48)));
    const minsAgo = Math.floor(Math.random() * 7 * 24 * 60);
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

  // Update total revenue
  const total = db.prepare("SELECT SUM(bid_amount) as total FROM listings WHERE paid = 1").get();
  db.prepare("UPDATE site_stats SET total_revenue = ?, updated_at = ? WHERE id = 1")
    .run(total.total, new Date().toISOString());
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings").get();
console.log(`Added ${added} new listings. Total: ${count.c}`);

db.close();
