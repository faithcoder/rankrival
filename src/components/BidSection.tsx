"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney } from "@/lib/utils";

const MIN = 500;
const MAX = 99_999_900;
const STEP = 100;
const wholeDollar = (value: number) => Math.ceil(value / 100) * 100;

export interface Preset {
  url: string;
  amount: number;
}

export default function BidSection({
  topBid,
  preset,
  onOutbid,
}: {
  topBid: number;
  preset: Preset | null;
  onOutbid: (url: string, amount: number) => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [amount, setAmount] = useState(() => Math.max(MIN, wholeDollar(topBid + 500)));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAmount((prev) => {
      // Only auto-adjust if the user hasn't manually moved off the default.
      return prev <= topBid ? Math.max(MIN, wholeDollar(topBid + 500)) : wholeDollar(prev);
    });
  }, [topBid]);

  useEffect(() => {
    if (preset) {
      setUrl(preset.url);
      setAmount(wholeDollar(preset.amount));
    }
  }, [preset]);

  const change = useCallback((delta: number) => {
    setAmount((a) => Math.min(MAX, Math.max(MIN, a + delta)));
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || submitting) return;
      setSubmitting(true);
      await onOutbid(url, amount);
      setSubmitting(false);
    },
    [url, amount, submitting, onOutbid]
  );

  return (
    <div className="fade-up flex w-full flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          Rank your rival #1 for
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => change(-STEP)}
            aria-label="Decrease bid"
            className="grid h-14 w-14 place-items-center rounded-xl bg-blue-100 text-2xl text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
          >
            −
          </button>
          <div className="number min-w-[150px] rounded-xl bg-white px-5 py-2 text-center text-4xl font-bold tracking-tight text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400 sm:text-5xl">
            <span className="mr-1 text-2xl align-top">$</span>
            {(amount / 100).toLocaleString("en-US")}
          </div>
          <button
            type="button"
            onClick={() => change(STEP)}
            aria-label="Increase bid"
            className="grid h-14 w-14 place-items-center rounded-xl bg-blue-100 text-2xl text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
          >
            +
          </button>
        </div>

      </div>

        <form onSubmit={submit} className="flex w-full max-w-4xl rounded-full border-2 border-blue-400 bg-white p-1.5 shadow-sm focus-within:border-blue-600 dark:bg-slate-900">
          <span className="grid w-12 shrink-0 place-items-center text-blue-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>
          </span>
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a website URL or X @handle"
            className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="pulse-glow h-12 shrink-0 cursor-pointer rounded-full bg-blue-700 px-8 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Processing…" : "Rank"}
          </button>
        </form>
      <p className="-mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
        Start at $5. Bids below #1 land at the highest position that amount can secure.
      </p>
    </div>
  );
}
