import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export interface Listing {
  id: number;
  url: string;
  domain: string;
  handle: string | null;
  description: string | null;
  bid_amount: number;
  clicks: number;
  clicks_this_hour: number;
  rank: number;
  created_at: string;
  updated_at: string;
  stripe_session_id: string | null;
  paid: number;
  category: string;
}

export interface BidEvent {
  id: number;
  listing_id: number;
  amount: number;
  previous_amount: number;
  created_at: string;
}

export interface SiteStats {
  id: number;
  total_visitors: number;
  total_revenue: number;
  updated_at: string;
}

const globalForDb = globalThis as unknown as { __rankrival_db?: Database.Database };

function ensureUpvoteSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS listing_upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      voter_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(listing_id, voter_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_listing_upvotes_listing ON listing_upvotes(listing_id);
    CREATE INDEX IF NOT EXISTS idx_listing_upvotes_created ON listing_upvotes(created_at);
  `);
}

function createDb(): Database.Database {
  const configuredDataDir = process.env.RANKRIVAL_DATA_DIR?.trim();
  const dataDir = configuredDataDir
    ? path.resolve(configuredDataDir)
    : path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(path.join(dataDir, "rankrival.db"));
  db.pragma("journal_mode = WAL");

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
      category TEXT NOT NULL DEFAULT 'other',
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

    CREATE TABLE IF NOT EXISTS listing_upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      voter_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(listing_id, voter_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_listing_upvotes_listing ON listing_upvotes(listing_id);
    CREATE INDEX IF NOT EXISTS idx_listing_upvotes_created ON listing_upvotes(created_at);

    CREATE TABLE IF NOT EXISTS visitor_events (
      visit_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_visitor_events_created ON visitor_events(created_at);

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

  const listingColumns = db.prepare("PRAGMA table_info(listings)").all() as { name: string }[];
  if (!listingColumns.some((column) => column.name === "category")) {
    db.exec("ALTER TABLE listings ADD COLUMN category TEXT NOT NULL DEFAULT 'other'");
  }

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__rankrival_db) {
    globalForDb.__rankrival_db = createDb();
  }
  ensureUpvoteSchema(globalForDb.__rankrival_db);
  return globalForDb.__rankrival_db;
}

function seedIfEmpty(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM listings").get() as { c: number }).c;
  if (count > 0) return;

  const now = Date.now();
  const mins = 60_000;

  // Load products from JSON files
  type ProductEntry = { url: string; name: string; description: string; category?: string };
  type MacAppEntry = { url: string; name: string; description: string; bid: number; clicks: number };

  let allSeeds: Array<{ url: string; domain: string; handle: string | null; description: string; bid: number; clicks: number; cph: number; minsAgo: number }> = [];
  const seen = new Set<string>();

  // Helper to extract domain
  function getDomain(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  }

  // 1. Mac apps (from bidmacapps.json)
  try {
    const macapps: MacAppEntry[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "bidmacapps.json"), "utf-8"));
    for (const app of macapps) {
      const domain = getDomain(app.url);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      allSeeds.push({
        url: app.url, domain, handle: null, description: app.description,
        bid: app.bid, clicks: app.clicks, cph: Math.max(1, Math.floor(app.clicks / 12)),
        minsAgo: Math.floor(Math.random() * 72 * 60),
      });
    }
  } catch { /* file not found — skip */ }

  // 2. Trending products (from trending.json) — highest bids
  try {
    const trending: ProductEntry[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "trending.json"), "utf-8"));
    for (let i = 0; i < trending.length; i++) {
      const p = trending[i];
      const domain = getDomain(p.url);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      const bid = 8000 - i * 200;
      const clicks = Math.floor(bid * (10 + Math.random() * 15));
      allSeeds.push({
        url: p.url, domain, handle: null, description: p.description,
        bid, clicks, cph: Math.max(5, Math.floor(clicks / 16)),
        minsAgo: Math.floor(Math.random() * 48 * 60),
      });
    }
  } catch { /* file not found — skip */ }

  // 3. Original products (from products.json) — tiered bids
  try {
    const products: ProductEntry[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "products.json"), "utf-8"));
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const domain = getDomain(p.url);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);
      let bid: number;
      if (i < 3) bid = 3000 + Math.floor(Math.random() * 2000);
      else if (i < 8) bid = 1500 + Math.floor(Math.random() * 1499);
      else if (i < 18) bid = 500 + Math.floor(Math.random() * 999);
      else if (i < 38) bid = 100 + Math.floor(Math.random() * 399);
      else if (i < 63) bid = 25 + Math.floor(Math.random() * 74);
      else bid = 5 + Math.floor(Math.random() * 19);
      const clicks = Math.floor(bid * (8 + Math.random() * 12));
      allSeeds.push({
        url: p.url, domain, handle: null, description: p.description,
        bid, clicks, cph: Math.max(1, Math.floor(clicks / (24 + Math.random() * 48))),
        minsAgo: Math.floor(Math.random() * 7 * 24 * 60),
      });
    }
  } catch { /* file not found — skip */ }

  if (allSeeds.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid)
    VALUES (@url, @domain, @handle, @description, @bid, @clicks, @cph, 0, @created_at, @updated_at, 1)
  `);

  const insertEvent = db.prepare(
    "INSERT INTO bid_events (listing_id, amount, previous_amount, created_at) VALUES (?, ?, ?, ?)"
  );

  const insertNow = db.transaction(() => {
    let totalRevenue = 0;
    for (const s of allSeeds) {
      const created = new Date(now - s.minsAgo * mins).toISOString();
      const info = insert.run({
        url: s.url, domain: s.domain, handle: s.handle, description: s.description,
        bid: s.bid, clicks: s.clicks, cph: s.cph, created_at: created, updated_at: created,
      });
      const id = Number(info.lastInsertRowid);
      insertEvent.run(id, s.bid, 0, created);
      totalRevenue += s.bid;
    }

    db.prepare(
      "INSERT INTO site_stats (total_visitors, total_revenue, updated_at) VALUES (?, ?, ?)"
    ).run(3400, totalRevenue, new Date().toISOString());
  });

  insertNow();
  recalculateRanks(db);
}

export function recalculateRanks(db: Database.Database): void {
  const rows = db
    .prepare(
      "SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC"
    )
    .all() as { id: number }[];

  const update = db.prepare("UPDATE listings SET rank = ? WHERE id = ?");
  db.transaction(() => {
    rows.forEach((row, i) => update.run(i + 1, row.id));
  })();
}

export function resetHourlyClicksIfNeeded(db: Database.Database): void {
  const row = db.prepare("SELECT value FROM meta WHERE key = 'last_hour_reset'").get() as
    | { value: string }
    | undefined;

  const now = Date.now();
  const last = row ? parseInt(row.value, 10) : 0;

  if (now - last >= 60 * 60 * 1000) {
    db.prepare("UPDATE listings SET clicks_this_hour = 0").run();
    db.prepare(
      "INSERT INTO meta (key, value) VALUES ('last_hour_reset', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(String(now));
  }
}

export function finalizePayment(
  db: Database.Database,
  listingId: number,
  fullAmount: number,
  previousAmount: number,
  sessionId?: string
): boolean {
  return db.transaction(() => {
    const listing = db
      .prepare("SELECT * FROM listings WHERE id = ?")
      .get(listingId) as Listing | undefined;

    if (!listing) return false;
    if (sessionId && listing.stripe_session_id !== sessionId) return false;
    if (listing.paid === 1 && listing.bid_amount !== previousAmount) return false;
    if (listing.paid === 0 && previousAmount !== 0) return false;
    if (fullAmount <= previousAmount || fullAmount < 500 || fullAmount > 99_999_900 || fullAmount % 100 !== 0) return false;

    const alreadyRecorded = db.prepare(
      "SELECT 1 FROM bid_events WHERE listing_id = ? AND amount = ? AND previous_amount = ? LIMIT 1"
    ).get(listingId, fullAmount, previousAmount);
    if (alreadyRecorded) return true;

    const chargeAmount = fullAmount - previousAmount;

    db.prepare("UPDATE listings SET bid_amount = ?, paid = 1, updated_at = ? WHERE id = ?").run(
      fullAmount,
      new Date().toISOString(),
      listingId
    );

    db.prepare(
      "INSERT INTO bid_events (listing_id, amount, previous_amount, created_at) VALUES (?, ?, ?, ?)"
    ).run(listingId, fullAmount, previousAmount, new Date().toISOString());

    const stats = getSiteStats(db);
    db.prepare(
      "UPDATE site_stats SET total_revenue = total_revenue + ?, updated_at = ? WHERE id = ?"
    ).run(chargeAmount, new Date().toISOString(), stats.id);
    return true;
  })();
}

export function finalizeFreeListing(
  db: Database.Database,
  listingId: number,
  amount: number,
  previousAmount = 0
): boolean {
  return db.transaction(() => {
    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as Listing | undefined;
    if (!listing || amount <= previousAmount || amount < 500 || amount > 99_999_900 || amount % 100 !== 0) return false;
    if (listing.paid === 1 && listing.bid_amount !== previousAmount) return false;
    if (listing.paid === 0 && previousAmount !== 0) return false;

    db.prepare(
      "UPDATE listings SET bid_amount = ?, paid = 1, updated_at = ? WHERE id = ?"
    ).run(amount, new Date().toISOString(), listingId);
    db.prepare(
      "INSERT INTO bid_events (listing_id, amount, previous_amount, created_at) VALUES (?, ?, ?, ?)"
    ).run(listingId, amount, previousAmount, new Date().toISOString());
    return true;
  })();
}

export function getSiteStats(db: Database.Database): SiteStats {
  const row = db.prepare("SELECT * FROM site_stats ORDER BY id DESC LIMIT 1").get() as
    | SiteStats
    | undefined;

  if (row) return row;

  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO site_stats (total_visitors, total_revenue, updated_at) VALUES (0, 0, ?)"
  ).run(now);
  return db.prepare("SELECT * FROM site_stats ORDER BY id DESC LIMIT 1").get() as SiteStats;
}
