import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "rankrival.db");

// Delete old DB to start fresh
try { fs.unlinkSync(dbPath); } catch {}
try { fs.unlinkSync(dbPath + "-shm"); } catch {}
try { fs.unlinkSync(dbPath + "-wal"); } catch {}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL, domain TEXT NOT NULL, handle TEXT, description TEXT,
    bid_amount INTEGER NOT NULL DEFAULT 0, clicks INTEGER NOT NULL DEFAULT 0,
    clicks_this_hour INTEGER NOT NULL DEFAULT 0, rank INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    stripe_session_id TEXT, category TEXT NOT NULL DEFAULT 'other', paid INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE bid_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL, amount INTEGER NOT NULL,
    previous_amount INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL, created_at TEXT NOT NULL, referrer TEXT
  );
  CREATE TABLE site_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_visitors INTEGER NOT NULL DEFAULT 0,
    total_revenue INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  );
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

// Load all product sources
const products = JSON.parse(fs.readFileSync(path.join(process.cwd(), "products.json"), "utf-8"));
const trending = JSON.parse(fs.readFileSync(path.join(process.cwd(), "trending.json"), "utf-8"));
const macapps = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bidmacapps.json"), "utf-8"));

const now = Date.now();
const mins = 60_000;

const insert = db.prepare(`
  INSERT INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid)
  VALUES (@url, @domain, @handle, @description, @bid, @clicks, @cph, 0, @created_at, @updated_at, 1)
`);
const insertEvent = db.prepare(`INSERT INTO bid_events (listing_id, amount, previous_amount, created_at) VALUES (?, ?, ?, ?)`);

let totalRevenue = 0;
const seen = new Set();

const insertAll = db.transaction(() => {
  // 1. Mac apps (medium bids — they're niche products)
  for (const app of macapps) {
    const domain = new URL(app.url).hostname.replace("www.", "");
    if (seen.has(domain)) continue;
    seen.add(domain);
    const cph = Math.max(1, Math.floor(app.clicks / 12));
    const minsAgo = Math.floor(Math.random() * 72 * 60);
    const created = new Date(now - minsAgo * mins).toISOString();
    const info = insert.run({ url: app.url, domain, handle: null, description: app.description, bid: app.bid, clicks: app.clicks, cph, created_at: created, updated_at: created });
    if (info.changes > 0) { insertEvent.run(Number(info.lastInsertRowid), app.bid, 0, created); totalRevenue += app.bid; }
  }

  // 2. Trending products (highest bids)
  for (let i = 0; i < trending.length; i++) {
    const p = trending[i];
    let domain;
    try { domain = new URL(p.url).hostname.replace("www.", ""); } catch { continue; }
    if (seen.has(domain)) continue;
    seen.add(domain);
    const bid = 8000 - i * 200;
    const clicks = Math.floor(bid * (10 + Math.random() * 15));
    const cph = Math.max(5, Math.floor(clicks / 16));
    const minsAgo = Math.floor(Math.random() * 48 * 60);
    const created = new Date(now - minsAgo * mins).toISOString();
    const info = insert.run({ url: p.url, domain, handle: null, description: p.description, bid, clicks, cph, created_at: created, updated_at: created });
    if (info.changes > 0) { insertEvent.run(Number(info.lastInsertRowid), bid, 0, created); totalRevenue += bid; }
  }

  // 3. Original products (tiered bids)
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let domain;
    try { domain = new URL(p.url).hostname.replace("www.", ""); } catch { continue; }
    if (seen.has(domain)) continue;
    seen.add(domain);
    let bid;
    if (i < 3) bid = 3000 + Math.floor(Math.random() * 2000);
    else if (i < 8) bid = 1500 + Math.floor(Math.random() * 1499);
    else if (i < 18) bid = 500 + Math.floor(Math.random() * 999);
    else if (i < 38) bid = 100 + Math.floor(Math.random() * 399);
    else if (i < 63) bid = 25 + Math.floor(Math.random() * 74);
    else bid = 5 + Math.floor(Math.random() * 19);
    const clicks = Math.floor(bid * (8 + Math.random() * 12));
    const cph = Math.max(1, Math.floor(clicks / (24 + Math.random() * 48)));
    const minsAgo = Math.floor(Math.random() * 7 * 24 * 60);
    const created = new Date(now - minsAgo * mins).toISOString();
    const info = insert.run({ url: p.url, domain, handle: null, description: p.description, bid, clicks, cph, created_at: created, updated_at: created });
    if (info.changes > 0) { insertEvent.run(Number(info.lastInsertRowid), bid, 0, created); totalRevenue += bid; }
  }

  // Recalculate ranks
  const rows = db.prepare("SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC").all();
  const updateRank = db.prepare("UPDATE listings SET rank = ? WHERE id = ?");
  rows.forEach((row, i) => updateRank.run(i + 1, row.id));

  // Site stats
  db.prepare("INSERT INTO site_stats (total_visitors, total_revenue, updated_at) VALUES (?, ?, ?)").run(3400, totalRevenue, new Date().toISOString());
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings WHERE paid = 1").get();
const top5 = db.prepare("SELECT rank, domain, bid_amount FROM listings ORDER BY bid_amount DESC LIMIT 5").all();
console.log(`Total: ${count.c} listings · $${totalRevenue} revenue`);
console.log("Top 5:");
top5.forEach(r => console.log(`  #${r.rank} ${r.domain} — $${r.bid_amount}`));

db.close();
