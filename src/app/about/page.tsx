import type { Metadata } from "next";
import Link from "next/link";
import { getDb, getSiteStats, Listing } from "@/lib/db";
import { formatClicks, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About", description: "Why RankRival exists and how its transparent paid leaderboard works.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  const db = getDb();
  const stats = getSiteStats(db);
  const listingCount = (db.prepare("SELECT COUNT(*) c FROM listings WHERE paid = 1").get() as { c: number }).c;
  const totalClicks = (db.prepare("SELECT COALESCE(SUM(clicks), 0) c FROM listings WHERE paid = 1").get() as { c: number }).c;
  const highest = db.prepare("SELECT * FROM listings WHERE paid = 1 ORDER BY bid_amount DESC LIMIT 1").get() as Listing | undefined;
  const highlights = [[formatClicks(stats.total_visitors), "visitors"], [formatMoney(stats.total_revenue), "revenue"], [formatClicks(listingCount), "active listings"], [highest ? formatMoney(highest.bid_amount) : "$0", highest ? `highest bid · ${highest.domain}` : "highest bid"]];

  return <article className="mx-auto max-w-4xl py-12 sm:py-16">
    <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">Our story</p>
    <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">About</h1>
    <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-600 dark:text-slate-300">RankRival is a simple public leaderboard: no display ads, no API keys, and no revenue sharing. Outbid your competitors to rank higher—that&apos;s it.</p>
    <section className="mt-14"><h2 className="text-2xl font-bold">A transparent market for attention</h2><p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Every paid listing competes under the same rules. The bid determines the position, older bids win ties, and every outbound click is counted publicly. Visitors discover products while builders can see exactly what a position costs.</p></section>
    <section className="mt-12"><h2 className="text-2xl font-bold">Live so far</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{highlights.map(([value, label]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="number text-2xl font-bold text-blue-700 dark:text-blue-400">{value}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p></div>)}</div><p className="mt-5 text-sm text-slate-500">The board has generated {formatClicks(totalClicks)} tracked outbound clicks.</p></section>
    <p className="mt-14 text-lg leading-8 text-slate-600 dark:text-slate-300">The board is still here. Same rules. Same idea. Rank is the bid—nothing else. Read the <Link href="/rules" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">rules</Link> or explore the <Link href="/stats" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">live stats</Link>.</p>
  </article>;
}
