"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import StatsBanner from "@/components/StatsBanner";
import BidSection, { Preset } from "@/components/BidSection";
import TrendingBar, { TrendingItem } from "@/components/TrendingBar";
import ActivityFeed, { ActivityItem } from "@/components/ActivityFeed";
import LeaderboardCard, { ListingItem } from "@/components/LeaderboardCard";
import CategorySidebar, { CategoryFilter } from "@/components/CategorySidebar";
import { CategorySlug, categoryLabel } from "@/lib/categories";
import TopUpvotedBar, { UpvotedItem } from "@/components/TopUpvotedBar";

interface ListingsResponse {
  listings: ListingItem[];
  category_counts: Record<string, number>;
}
interface TrendingResponse {
  trending: TrendingItem[];
}
interface UpvotedResponse {
  upvoted: UpvotedItem[];
}
interface ActivityResponse {
  activity: ActivityItem[];
}
interface StatsResponse {
  total_visitors: number;
}
interface OnlineResponse {
  online: number;
  total_visitors: number;
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [voteRefresh, setVoteRefresh] = useState(0);
  const listingsUrl = activeCategory === "all"
    ? `/api/listings?v=${voteRefresh}`
    : `/api/listings?category=${encodeURIComponent(activeCategory)}&v=${voteRefresh}`;
  const { data: listingsData, loading: listingsLoading } =
    usePolling<ListingsResponse>(listingsUrl, 15000);
  const { data: trendingData } = usePolling<TrendingResponse>(
    "/api/trending",
    15000
  );
  const { data: upvotedData } = usePolling<UpvotedResponse>(
    `/api/top-upvoted?v=${voteRefresh}`,
    15000
  );
  const { data: activityData } = usePolling<ActivityResponse>(
    "/api/activity",
    15000
  );
  const { data: statsData } = usePolling<StatsResponse>("/api/stats", 30000);
  const { data: onlineData } = usePolling<OnlineResponse>("/api/online", 30000);

  const [preset, setPreset] = useState<Preset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<3 | 10 | 20>(20);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [visitorTotal, setVisitorTotal] = useState<number | null>(null);

  useEffect(() => {
    const storedTotal = Number(sessionStorage.getItem("rankrival_visitor_total"));
    if (Number.isFinite(storedTotal) && storedTotal >= 0) setVisitorTotal(storedTotal);
    const updateVisitors = (event: Event) => setVisitorTotal((event as CustomEvent<number>).detail);
    window.addEventListener("rankrival:visitors", updateVisitors);
    return () => window.removeEventListener("rankrival:visitors", updateVisitors);
  }, []);

  const listings = listingsData?.listings ?? [];
  const totalListingCount = Object.values(listingsData?.category_counts ?? {}).reduce((sum, count) => sum + count, 0);
  const topBid = listings.length > 0 ? listings[0].bid_amount : 0;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredListings = normalizedSearch
    ? listings.filter((listing) =>
        [listing.domain, listing.url, listing.handle, listing.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      )
    : listings;
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleListings = filteredListings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const paginationItems: Array<number | string> = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [
        1,
        ...(currentPage > 4 ? ["start-ellipsis"] : []),
        ...Array.from(
          { length: 5 },
          (_, index) => Math.max(2, Math.min(totalPages - 5, currentPage - 2)) + index
        ),
        ...(currentPage < totalPages - 3 ? ["end-ellipsis"] : []),
        totalPages,
      ];

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const handleClaim = useCallback((l: ListingItem) => {
    setError(null);
    setPreset({ url: l.url, amount: Math.ceil((l.bid_amount + 500) / 100) * 100, category: l.category as CategorySlug });
    setNotice(
      `To take rank #${l.rank} from ${l.domain}, outbid them by at least $5.`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleOutbid = useCallback(async (url: string, amount: number, category: CategorySlug) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/outbid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, amount, category }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }, []);

  const handleUpvote = useCallback(async (listing: ListingItem) => {
    setError(null);
    try {
      const response = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to update your vote.");
        return;
      }
      setVoteRefresh((value) => value + 1);
    } catch {
      setError("Network error. Please try your vote again.");
    }
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <section className="hero-grid -mx-4 border-b border-blue-100 px-4 pb-12 pt-5 dark:border-blue-950 sm:pb-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-7">
          <StatsBanner
            online={onlineData?.online ?? 0}
            visitors={visitorTotal ?? onlineData?.total_visitors ?? statsData?.total_visitors ?? 0}
            listings={totalListingCount || listings.length}
          />
          <BidSection topBid={topBid} preset={preset} onOutbid={handleOutbid} activeCategory={activeCategory} />
        </div>
      </section>

      {notice && (
        <div className="fade-up rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="fade-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
      <CategorySidebar
        active={activeCategory}
        counts={listingsData?.category_counts ?? {}}
        onChange={(category) => {
          setActiveCategory(category);
          setPage(1);
          setError(null);
          setNotice(null);
        }}
      />
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {activeCategory === "all" ? "Live leaderboard" : `${categoryLabel(activeCategory)} leaderboard`}
          </h2>
          <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-slate-400" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </span>
            <span className="sr-only">Search listings</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search your listing…"
              className="h-10 w-full rounded-xl border border-blue-100 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 dark:border-blue-900 dark:bg-slate-900 dark:text-slate-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span className="sr-only">Listings per page</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as 3 | 10 | 20);
                setPage(1);
              }}
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 font-medium text-slate-700 outline-none transition-colors hover:border-blue-300 focus:border-blue-500 dark:border-blue-900 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value={3}>Top 3</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </label>
        </div>

        {listingsLoading && listings.length === 0 ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400 dark:border-neutral-800">
            No listings yet. Be the first to claim #1.
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            No listing matches “{searchQuery.trim()}”.
          </div>
        ) : (
          visibleListings.map((listing) => (
            <Fragment key={listing.id}>
              <LeaderboardCard
                listing={listing}
                onClaim={handleClaim}
                onUpvote={handleUpvote}
              />
              {[3, 10, 20].includes(listing.rank) && listing.rank < filteredListings.length && (
                <div className="my-4 flex items-center gap-4" aria-label={`End of top ${listing.rank}`}>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-200 dark:to-blue-900" />
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Top {listing.rank}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-200 dark:to-blue-900" />
                </div>
              )}
            </Fragment>
          ))
        )}

        {filteredListings.length > pageSize && (
          <nav
            className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"
            aria-label="Leaderboard pagination"
          >
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredListings.length)} of {filteredListings.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
              >
                Previous
              </button>
              {paginationItems.map((item) => typeof item === "string" ? (
                <span key={item} className="px-1 text-slate-400" aria-hidden="true">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={currentPage === item ? "page" : undefined}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition-colors ${
                    currentPage === item
                      ? "bg-blue-700 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-24">
        <TrendingBar trending={trendingData?.trending ?? []} />
        <TopUpvotedBar upvoted={upvotedData?.upvoted ?? []} />
        <ActivityFeed activity={activityData?.activity ?? []} />
      </aside>
      </div>
    </div>
  );
}
