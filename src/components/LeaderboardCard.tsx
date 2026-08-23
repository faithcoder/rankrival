"use client";

import { useState } from "react";
import { formatMoney, formatClicks, timeAgo } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import ShareListing from "@/components/ShareListing";

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
  category: string;
  upvotes: number;
  has_upvoted: boolean;
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
  onUpvote,
}: {
  listing: ListingItem;
  onClaim: (listing: ListingItem) => void;
  onUpvote: (listing: ListingItem) => Promise<void>;
}) {
  const [voting, setVoting] = useState(false);
  const style = rankStyles[listing.rank] || {
    ring: "border-neutral-200 dark:border-neutral-800",
    badge: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    label: "text-neutral-400",
    surface: "bg-white dark:bg-neutral-900",
  };

  const isTop = listing.rank <= 3;

  return (
    <div
      className={`fade-up grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-2xl border p-4 shadow-sm transition-colors sm:flex sm:gap-4 ${style.surface} ${style.ring} ${
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
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400">
          <span className="max-w-full truncate rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:max-w-36">
            {categoryLabel(listing.category)}
          </span>
          <span className="whitespace-nowrap">listed {timeAgo(listing.created_at)}</span>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="number whitespace-nowrap font-medium text-neutral-600 dark:text-neutral-300">
            {formatClicks(listing.clicks)} clicks
          </span>
          <button
            type="button"
            disabled={voting}
            aria-pressed={listing.has_upvoted}
            aria-label={`${listing.has_upvoted ? "Remove upvote from" : "Upvote"} ${listing.domain}`}
            onClick={async () => {
              setVoting(true);
              await onUpvote(listing);
              setVoting(false);
            }}
            className={`number inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 ${listing.has_upvoted ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" : "text-neutral-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950"}`}
          >
            <span aria-hidden="true">▲</span>{listing.upvotes}
          </button>
        </div>
      </div>

      <div className="col-span-2 col-start-2 flex min-w-0 shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
        <span className={`number text-xl font-bold ${isTop ? style.label : ""}`}>
          {formatMoney(listing.bid_amount)}
        </span>
        <div className="flex items-center gap-2">
          <ShareListing id={listing.id} domain={listing.domain} compact />
          <button
            type="button"
            onClick={() => onClaim(listing)}
            className="cursor-pointer whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            claim this rank
          </button>
        </div>
      </div>
    </div>
  );
}
