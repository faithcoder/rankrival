import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "bidboard.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    handle TEXT,
    description TEXT,
    bid_amount INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    clicks_this_hour INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    stripe_session_id TEXT,
    paid INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS bid_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    previous_amount INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    referrer TEXT
  );
  CREATE TABLE IF NOT EXISTS site_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_visitors INTEGER NOT NULL DEFAULT 0,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const apps = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bidmacapps.json"), "utf-8"));

const insert = db.prepare(`
  INSERT OR IGNORE INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid)
  VALUES (@url, @domain, @handle, @description, @bid, @clicks, @cph, 0, @created_at, @updated_at, 1)
`);

const insertEvent = db.prepare(`
  INSERT INTO bid_events (listing_id, amount, previous_amount, created_at)
  VALUES (?, ?, ?, ?)
`);

const now = Date.now();
const mins = 60_000;
let added = 0;

const insertAll = db.transaction(() => {
  for (const app of apps) {
    const domain = new URL(app.url).hostname.replace("www.", "");

    // Skip if already exists
    const existing = db.prepare("SELECT id FROM listings WHERE domain = ?").get(domain);
    if (existing) {
      console.log(`Skipping ${domain} — already exists`);
      continue;
    }

    const cph = Math.max(1, Math.floor(app.clicks / (12 + Math.random() * 24)));
    const minsAgo = Math.floor(Math.random() * 72 * 60); // 0-3 days
    const created = new Date(now - minsAgo * mins).toISOString();

    const info = insert.run({
      url: app.url,
      domain: domain,
      handle: null,
      description: app.description,
      bid: app.bid,
      clicks: app.clicks,
      cph: cph,
      created_at: created,
      updated_at: created,
    });

    if (info.changes > 0) {
      const id = Number(info.lastInsertRowid);
      insertEvent.run(id, app.bid, 0, created);
      added++;
      console.log(`Added ${domain} — $${app.bid}`);
    }
  }

  // Recalculate all ranks
  const rows = db
    .prepare("SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC")
    .all();

  const updateRank = db.prepare("UPDATE listings SET rank = ? WHERE id = ?");
  rows.forEach((row, i) => updateRank.run(i + 1, row.id));
});

insertAll();

const count = db.prepare("SELECT COUNT(*) as c FROM listings WHERE paid = 1").get();
console.log(`\nAdded ${added} Mac apps. Total listings: ${count.c}`);

db.close();
