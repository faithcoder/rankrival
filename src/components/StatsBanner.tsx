"use client";

import { formatClicks } from "@/lib/utils";

export default function StatsBanner({
  online,
  visitors,
  listings,
}: {
  online: number;
  visitors: number;
  listings: number;
}) {
  return (
    <div className="rounded-full border border-blue-100 bg-white px-5 py-2 text-sm text-slate-500 shadow-sm dark:border-blue-900 dark:bg-slate-950 dark:text-slate-400">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="number font-medium text-neutral-700 dark:text-neutral-200">
            {online}
          </span>
          online
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span>
          <span className="number font-medium text-neutral-700 dark:text-neutral-200">
            {formatClicks(visitors)}
          </span>{" "}
          visitors since launch
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span><span className="number font-semibold text-slate-800 dark:text-white">{listings}</span> ranked</span>
      </div>
    </div>
  );
}
