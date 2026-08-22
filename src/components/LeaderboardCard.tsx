"use client";

import { formatMoney, formatClicks, timeAgo } from "@/lib/utils";

export interface ListingItem {
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
  paid: number;
}

const rankStyles: Record<number, { ring: string; badge: string; label: string; surface: string }> = {
  1: {
    ring: "border-orange-400 dark:border-orange-500",
    badge: "bg-orange-500 text-white shadow-sm",
    label: "text-orange-600 dark:text-orange-400",
    surface: "bg-orange-50 dark:bg-orange-950/35",
  },
  2: {
    ring: "border-orange-300 dark:border-orange-700",
    badge: "bg-orange-500 text-white shadow-sm",
    label: "text-orange-600 dark:text-orange-400",
    surface: "bg-orange-50/70 dark:bg-orange-950/25",
  },
  3: {
    ring: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-500 text-white shadow-sm",
    label: "text-orange-600 dark:text-orange-400",
    surface: "bg-orange-50/40 dark:bg-orange-950/15",
  },
};

export default function LeaderboardCard({
  listing,
  onClaim,
}: {
  listing: ListingItem;
  onClaim: (listing: ListingItem) => void;
}) {
  const style = rankStyles[listing.rank] || {
    ring: "border-neutral-200 dark:border-neutral-800",
    badge: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    label: "text-neutral-400",
    surface: "bg-white dark:bg-neutral-900",
  };

  const isTop = listing.rank <= 3;

  return (
    <div
      className={`fade-up flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-colors ${style.surface} ${style.ring} ${
        isTop ? "border" : "border-neutral-200 dark:border-neutral-800"
      }`}
      style={{ animationDelay: `${Math.min(listing.rank, 10) * 40}ms` }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className={`number grid min-w-11 place-items-center rounded-xl px-2 py-2 text-lg font-bold leading-none ${isTop ? style.badge : "text-neutral-500"}`}>
          #{listing.rank}
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/favicon?domain=${encodeURIComponent(listing.domain)}`}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-lg border border-neutral-100 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={`/api/redirect?id=${listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-semibold hover:underline"
          >
            {listing.domain}
          </a>
        </div>
        {listing.description ? (
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {listing.description}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-sm text-neutral-400 dark:text-neutral-500">
            {listing.url.replace(/^https?:\/\//, "")}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
          <span>listed {timeAgo(listing.created_at)}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
          <span className="number font-medium text-neutral-600 dark:text-neutral-300">
            {formatClicks(listing.clicks)} clicks
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`number text-xl font-bold ${isTop ? style.label : ""}`}>
          {formatMoney(listing.bid_amount)}
        </span>
        <button
          type="button"
          onClick={() => onClaim(listing)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          claim this rank
        </button>
      </div>
    </div>
  );
}
