"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/utils";

function SuccessContent() {
  const params = useSearchParams();
  const domain = params.get("domain") || "your site";
  const amountRaw = params.get("amount");
  const amount = amountRaw ? Number(amountRaw) : 0;

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-5 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re on the board!</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {domain} has been listed{amount > 0 ? ` at ${formatMoney(amount)}` : ""}.
          Your rank is live and clicks are being tracked.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          View leaderboard
        </Link>
        <Link
          href="/stats"
          className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          See stats
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-16">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-white" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
