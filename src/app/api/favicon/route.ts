import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: Buffer;
  contentType: string;
  expiry: number;
}

const globalForFavicon = globalThis as unknown as {
  __favicon_cache?: Map<string, CacheEntry>;
};

function cache(): Map<string, CacheEntry> {
  if (!globalForFavicon.__favicon_cache) {
    globalForFavicon.__favicon_cache = new Map();
  }
  return globalForFavicon.__favicon_cache;
}

async function fetchImage(url: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "rankrival/1.0" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/x-icon";
    if (!contentType.startsWith("image/")) return null;
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length === 0 || data.length > 1_000_000) return null;
    return { data, contentType };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return new Response("missing domain", { status: 400 });
  }

  const safe = domain.replace(/[^a-zA-Z0-9.-]/g, "");
  if (!safe || safe !== domain || safe === "localhost" || /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(safe)) {
    return new Response("invalid domain", { status: 400 });
  }
  const c = cache();
  const hit = c.get(safe);
  if (hit && hit.expiry > Date.now()) {
    return new Response(new Uint8Array(hit.data), {
      headers: { "Content-Type": hit.contentType, "Cache-Control": "public, max-age=86400" },
    });
  }

  const sources = [
    `https://${safe}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${safe}&sz=64`,
  ];

  for (const url of sources) {
    const result = await fetchImage(url);
    if (result) {
      c.set(safe, { data: result.data, contentType: result.contentType, expiry: Date.now() + CACHE_TTL });
      return new Response(new Uint8Array(result.data), {
        headers: { "Content-Type": result.contentType, "Cache-Control": "public, max-age=86400" },
      });
    }
  }

  return new Response(null, { status: 404 });
}
