"use client";

import { useState } from "react";

export default function ShareListing({ id, domain, compact = false }: { id: number; domain: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/listing/${id}?ref=share-${id}`;
    const data = { title: `${domain} on RankRival`, text: `See ${domain} on the RankRival leaderboard.`, url };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={share}
      className="cursor-pointer whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
      aria-label={`Share ${domain}`}
    >
      {copied ? "Link copied" : compact ? "Share" : "Share referral link"}
    </button>
  );
}
