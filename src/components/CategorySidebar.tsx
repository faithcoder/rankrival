"use client";

import { CATEGORIES, CategorySlug } from "@/lib/categories";

export type CategoryFilter = CategorySlug | "all";

export default function CategorySidebar({
  active,
  counts,
  onChange,
}: {
  active: CategoryFilter;
  counts: Record<string, number>;
  onChange: (category: CategoryFilter) => void;
}) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <aside className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-950 dark:bg-slate-900 xl:sticky xl:top-24">
      <h2 className="text-lg font-bold tracking-tight">Categories</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Every category has its own ranking. Pick one to see who leads it.
      </p>

      <select
        value={active}
        onChange={(event) => onChange(event.target.value as CategoryFilter)}
        aria-label="Filter leaderboard by category"
        className="mt-4 w-full cursor-pointer rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-slate-950 xl:hidden"
      >
        <option value="all">All categories ({total})</option>
        {CATEGORIES.map(([slug, label]) => (
          <option key={slug} value={slug}>{label} ({counts[slug] ?? 0})</option>
        ))}
      </select>

      <div className="mt-4 hidden max-h-[calc(100vh-12rem)] flex-col gap-1 overflow-y-auto pr-1 xl:flex">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${active === "all" ? "bg-blue-700 font-semibold text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-300 dark:hover:bg-blue-950"}`}
        >
          <span className="whitespace-nowrap">All categories</span><span className="number text-xs opacity-70">{total}</span>
        </button>
        {CATEGORIES.map(([slug, label]) => (
          <button
            key={slug}
            type="button"
            onClick={() => onChange(slug)}
            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${active === slug ? "bg-blue-700 font-semibold text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-800 dark:text-slate-300 dark:hover:bg-blue-950"}`}
          >
            <span className="whitespace-nowrap">{label}</span><span className="number shrink-0 text-xs opacity-70">{counts[slug] ?? 0}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
