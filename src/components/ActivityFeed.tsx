"use client";

import { formatMoney, timeAgo } from "@/lib/utils";

export interface ActivityItem {
  id: number;
  amount: number;
  previous_amount: number;
  created_at: string;
  domain: string;
  url: string;
  rank: number;
}

export default function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <section className="fade-up rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <h2 className="font-semibold">Recent activity</h2>
      </div>

      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {(!activity || activity.length === 0) && (
          <li className="py-5 text-center text-sm text-neutral-400">No activity yet.</li>
        )}
        {activity.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
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
            <span className="ml-auto shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              #{item.rank}
            </span>
            <span className="number shrink-0 text-sm font-semibold">
              {formatMoney(item.amount)}
            </span>
            <span className="hidden shrink-0 text-right text-xs text-neutral-400 xl:block">
              {timeAgo(item.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
