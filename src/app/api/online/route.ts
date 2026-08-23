import { NextRequest } from "next/server";
import { getDb, getSiteStats } from "@/lib/db";
import { getFakeOnline, getFakeVisitors } from "@/lib/fake-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ online: getFakeOnline(), total_visitors: getFakeVisitors() });
}

export async function POST(req: NextRequest) {
  // Still accept heartbeats for future real tracking, but return fake numbers for now
  let body: { sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  return Response.json({ online: getFakeOnline(), total_visitors: getFakeVisitors() });
}
