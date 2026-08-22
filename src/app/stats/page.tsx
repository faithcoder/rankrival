"use client";

import { usePolling } from "@/hooks/usePolling";
import { formatMoney, formatClicks } from "@/lib/utils";

interface Stats {
  total_visitors: number;
  total_revenue: number;
  total_listings: number;
  total_clicks: number;
  clicks_last_24h: number;
  highest_bid: { domain: string; bid_amount: number } | null;
  hourly_clicks: { hour: string; clicks: number }[];
  top_listings: { id: number; domain: string; rank: number; clicks: number; clicks_this_hour: number }[];
  referrers: { source: string; clicks: number }[];
}

function Bars({ items, labelKey = "domain" }: { items: Array<Record<string, string | number>>; labelKey?: string }) {
  const max = Math.max(1, ...items.map((item) => Number(item.clicks)));
  return <div className="space-y-2">{items.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No traffic recorded yet.</p> : items.map((item) => <div key={String(item[labelKey])} className="relative overflow-hidden rounded-lg px-3 py-2.5"><span className="absolute inset-y-0 left-0 rounded-lg bg-blue-100 dark:bg-blue-950" style={{ width: `${Math.max(4, Number(item.clicks) / max * 100)}%` }} /><div className="relative flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium">{String(item[labelKey])}</span><span className="number shrink-0 font-semibold">{formatClicks(Number(item.clicks))}</span></div></div>)}</div>;
}

export default function StatsPage() {
  const { data, loading } = usePolling<Stats>("/api/stats", 15000);
  const { data: onlineData } = usePolling<{ online: number }>("/api/online", 15000);
  const points = data?.hourly_clicks ?? [];
  const max = Math.max(1, ...points.map((point) => point.clicks));
  const coords = points.map((point, index) => `${points.length <= 1 ? 0 : index / (points.length - 1) * 100},${92 - point.clicks / max * 78}`).join(" ");
  const area = points.length ? `0,92 ${coords} 100,92` : "";
  const cards = [
    [formatClicks(data?.clicks_last_24h ?? 0), "Clicks · last 24 hours"],
    [formatClicks(data?.total_clicks ?? 0), "All-time outbound clicks"],
    [formatMoney(data?.total_revenue ?? 0), "Verified revenue"],
    [formatClicks(data?.total_listings ?? 0), "Active listings"],
    [formatClicks(onlineData?.online ?? 0), "Online now"],
  ];

  return <div className="py-8 sm:py-12">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">Live analytics</p><h1 className="mt-2 text-4xl font-bold tracking-tight">RankRival stats</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Public, first-party leaderboard data. Updates every 15 seconds.</p></div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live</div></header>

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid border-b border-slate-100 sm:grid-cols-3 lg:grid-cols-5 dark:border-slate-800">{cards.map(([value, label]) => <div key={label} className="border-b border-slate-100 p-5 last:border-0 sm:border-b-0 sm:border-r dark:border-slate-800"><p className="number text-2xl font-bold">{loading ? "…" : value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div>
      <div className="p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Outbound clicks</h2><span className="text-xs text-slate-400">Hourly · UTC</span></div><div className="relative h-72 border-b border-l border-slate-200 dark:border-slate-700"><div className="absolute inset-x-0 top-1/3 border-t border-dashed border-slate-200 dark:border-slate-700" /><div className="absolute inset-x-0 top-2/3 border-t border-dashed border-slate-200 dark:border-slate-700" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Clicks during the last 24 hours"><defs><linearGradient id="clickArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#60a5fa" stopOpacity=".4"/><stop offset="1" stopColor="#60a5fa" stopOpacity="0"/></linearGradient></defs>{area && <polygon points={area} fill="url(#clickArea)" />}{coords && <polyline points={coords} fill="none" stroke="#3b82f6" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}</svg></div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>24h ago</span><span>12h ago</span><span>Now</span></div></div>
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Top listings by clicks</h2><span className="text-xs text-slate-400">All time</span></div><Bars items={(data?.top_listings ?? []) as unknown as Array<Record<string, string | number>>} /></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Referral sources</h2><span className="text-xs text-slate-400">Tracked clicks</span></div><Bars items={(data?.referrers ?? []) as unknown as Array<Record<string, string | number>>} labelKey="source" /></section></div>

    <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30"><p className="text-sm text-slate-600 dark:text-slate-300"><strong className="text-slate-950 dark:text-white">Highest bid:</strong> {data?.highest_bid ? `${formatMoney(data.highest_bid.bid_amount)} by ${data.highest_bid.domain}` : "No paid listings yet."} RankRival intentionally reports only data it collects; it does not fingerprint visitors or infer location, device, or browser.</p></section>
  </div>;
}
