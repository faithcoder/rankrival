import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb, Listing } from "@/lib/db";
import { categoryLabel } from "@/lib/categories";
import { formatClicks, formatMoney, timeAgo } from "@/lib/utils";
import ShareListing from "@/components/ShareListing";

export const dynamic = "force-dynamic";

function getListing(id: number): Listing | undefined {
  if (!Number.isInteger(id) || id < 1) return undefined;
  return getDb().prepare("SELECT * FROM listings WHERE id = ? AND paid = 1").get(id) as Listing | undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(Number(id));
  if (!listing) return { title: "Listing not found" };
  const title = `${listing.domain} is #${listing.rank} on RankRival`;
  const description = listing.description || `View ${listing.domain}'s live rank, clicks, and category on RankRival.`;
  return {
    title,
    description,
    alternates: { canonical: `/listing/${listing.id}` },
    openGraph: { title, description, url: `/listing/${listing.id}`, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(Number(id));
  if (!listing) notFound();
  const upvotes = (getDb().prepare("SELECT COUNT(*) count FROM listing_upvotes WHERE listing_id = ?").get(listing.id) as { count: number }).count;

  return (
    <section className="mx-auto max-w-3xl py-12 sm:py-20">
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-blue-900 dark:bg-slate-900 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/favicon?domain=${encodeURIComponent(listing.domain)}`} alt="" className="h-20 w-20 rounded-2xl border border-neutral-100 bg-white p-2 dark:border-neutral-800" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">#{listing.rank} · {categoryLabel(listing.category)}</p><h1 className="mt-1 break-words text-3xl font-bold">{listing.domain}</h1></div>
              <span className="number text-2xl font-bold text-blue-700 dark:text-blue-400">{formatMoney(listing.bid_amount)}</span>
            </div>
            {listing.description && <p className="mt-4 text-neutral-600 dark:text-neutral-300">{listing.description}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500"><span>Listed {timeAgo(listing.created_at)}</span><span>{formatClicks(listing.clicks)} clicks</span><span>{upvotes} upvotes</span></div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`/api/redirect?id=${listing.id}&ref=listing-${listing.id}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Visit website</a>
              <ShareListing id={listing.id} domain={listing.domain} />
              <Link href="/" className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">View leaderboard</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
