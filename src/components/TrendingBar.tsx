"use client";

import { formatClicks } from "@/lib/utils";

export interface TrendingItem {
  id: number;
  url: string;
  domain: string;
  handle: string | null;
  bid_amount: number;
  clicks: number;
  clicks_this_hour: number;
  rank: number;
}

export default function TrendingBar({ trending }: { trending: TrendingItem[] }) {
  return (
    <section className="fade-up rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <h2 className="font-semibold">Top trend</h2>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {(!trending || trending.length === 0) && (
          <p className="py-5 text-center text-sm text-neutral-400">No trends yet.</p>
        )}
        {trending.map((item, i) => (
          <a
            key={item.id}
            href={`/api/redirect?id=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 py-3 transition-colors hover:text-blue-700 dark:hover:text-blue-400"
          >
            <div className="flex min-w-0 w-full items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="number text-xs font-medium text-neutral-400">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/favicon?domain=${encodeURIComponent(item.domain)}`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded"
                  loading="lazy"
                />
                <span className="truncate text-sm font-medium">{item.domain}</span>
              </div>
              <span className="number ml-auto shrink-0 text-sm text-neutral-400">
                {formatClicks(item.clicks_this_hour)}/h
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
