import { NextRequest } from "next/server";
import { getDb, getSiteStats } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalForOnline = globalThis as unknown as {
  __online_sessions?: Map<string, number>;
};

function sessions(): Map<string, number> {
  if (!globalForOnline.__online_sessions) {
    globalForOnline.__online_sessions = new Map();
  }
  return globalForOnline.__online_sessions;
}

function prune(): void {
  const cutoff = Date.now() - 60_000;
  const s = sessions();
  for (const [key, lastSeen] of s.entries()) {
    if (lastSeen < cutoff) s.delete(key);
  }
}

export async function GET() {
  prune();
  return Response.json({ online: sessions().size, total_visitors: getSiteStats(getDb()).total_visitors });
}

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; visitId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const sessionId =
    body.sessionId || req.headers.get("x-session-id") || "anonymous";
  sessions().set(sessionId, Date.now());
  prune();

  const visitId = typeof body.visitId === "string" && /^[a-zA-Z0-9_-]{12,100}$/.test(body.visitId)
    ? body.visitId
    : null;
  const db = getDb();
  if (visitId) {
    const inserted = db.prepare(
      "INSERT OR IGNORE INTO visitor_events (visit_id, created_at) VALUES (?, ?)"
    ).run(visitId, new Date().toISOString());
    if (inserted.changes === 1) {
      const stats = getSiteStats(db);
      db.prepare(
        "UPDATE site_stats SET total_visitors = total_visitors + 1, updated_at = ? WHERE id = ?"
      ).run(new Date().toISOString(), stats.id);
    }
  }

  return Response.json({ online: sessions().size, total_visitors: getSiteStats(db).total_visitors });
}
