import { NextRequest } from "next/server";

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
  return Response.json({ online: sessions().size });
}

export async function POST(req: NextRequest) {
  let body: { sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const sessionId =
    body.sessionId || req.headers.get("x-session-id") || "anonymous";
  sessions().set(sessionId, Date.now());
  prune();

  return Response.json({ online: sessions().size });
}
