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
  const dataDir = path.join(process.cwd(), "data");
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

  const seeds: Array<{
    url: string;
    domain: string;
    handle: string;
    description: string;
    bid: number;
    clicks: number;
    cph: number;
    minsAgo: number;
  }> = [
    {
      url: "https://notion.so",
      domain: "notion.so",
      handle: "notion",
      description: "All-in-one workspace for notes, docs, and projects.",
      bid: 5000,
      clicks: 48213,
      cph: 96,
      minsAgo: 45,
    },
    {
      url: "https://linear.app",
      domain: "linear.app",
      handle: "linear",
      description: "The issue tracking tool you'll actually enjoy using.",
      bid: 3500,
      clicks: 31204,
      cph: 71,
      minsAgo: 120,
    },
    {
      url: "https://vercel.com",
      domain: "vercel.com",
      handle: "vercel",
      description: "Deploy frontend apps at the speed of thought.",
      bid: 2800,
      clicks: 26980,
      cph: 58,
      minsAgo: 300,
    },
    {
      url: "https://supabase.com",
      domain: "supabase.com",
      handle: "supabase",
      description: "The open source Firebase alternative.",
      bid: 2000,
      clicks: 19811,
      cph: 44,
      minsAgo: 600,
    },
    {
      url: "https://stripe.com",
      domain: "stripe.com",
      handle: "stripe",
      description: "Payments infrastructure for the internet.",
      bid: 1500,
      clicks: 15430,
      cph: 33,
      minsAgo: 900,
    },
    {
      url: "https://railway.app",
      domain: "railway.app",
      handle: "railway",
      description: "Deploy infrastructure in seconds, not sprints.",
      bid: 1200,
      clicks: 9877,
      cph: 21,
      minsAgo: 1440,
    },
    {
      url: "https://raycast.com",
      domain: "raycast.com",
      handle: "raycast",
      description: "A blazingly fast launcher for your Mac.",
      bid: 800,
      clicks: 7201,
      cph: 15,
      minsAgo: 1800,
    },
    {
      url: "https://excalidraw.com",
      domain: "excalidraw.com",
      handle: "excalidraw",
      description: "Virtual whiteboard for sketching hand-drawn like diagrams.",
      bid: 500,
      clicks: 4102,
      cph: 9,
      minsAgo: 2160,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO listings (url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, paid)
    VALUES (@url, @domain, @handle, @description, @bid, @clicks, @cph, 0, @created_at, @updated_at, 1)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO bid_events (listing_id, amount, previous_amount, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertNow = db.transaction(() => {
    let totalRevenue = 0;
    for (const s of seeds) {
      const created = new Date(now - s.minsAgo * mins).toISOString();
      const info = insert.run({
        url: s.url,
        domain: s.domain,
        handle: s.handle,
        description: s.description,
        bid: s.bid,
        clicks: s.clicks,
        cph: s.cph,
        created_at: created,
        updated_at: created,
      });
      const id = Number(info.lastInsertRowid);
      insertEvent.run(id, s.bid, 0, created);
      totalRevenue += s.bid;
    }

    db.prepare(
      "INSERT INTO site_stats (total_visitors, total_revenue, updated_at) VALUES (?, ?, ?)"
    ).run(147392, totalRevenue, new Date().toISOString());
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
