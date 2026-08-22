"use client";

export interface UpvotedItem {
  id: number;
  url: string;
  domain: string;
  handle: string | null;
  bid_amount: number;
  rank: number;
  upvotes: number;
  vote_score: number;
}

export default function TopUpvotedBar({ upvoted }: { upvoted: UpvotedItem[] }) {
  return (
    <section className="fade-up rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-orange-500" aria-hidden="true">▲</span>
        <h2 className="font-semibold">Top upvoted</h2>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {upvoted.length === 0 && (
          <p className="py-5 text-center text-sm text-neutral-400">No upvotes yet.</p>
        )}
        {upvoted.map((item, index) => (
          <a
            key={item.id}
            href={`/api/redirect?id=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 py-3 transition-colors hover:text-blue-700 dark:hover:text-blue-400"
          >
            <span className="number text-xs font-medium text-neutral-400">{index + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/favicon?domain=${encodeURIComponent(item.domain)}`} alt="" width={20} height={20} className="h-5 w-5 rounded" loading="lazy" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.domain}</span>
            <span className="number shrink-0 text-sm font-semibold text-orange-600 dark:text-orange-400">▲ {item.upvotes.toLocaleString("en-US")}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
