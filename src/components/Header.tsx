"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Leaderboard" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur dark:bg-slate-950/90">
      <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 19V9m5 10V5m5 14v-7m4 7H3" /></svg>
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">rankrival<span className="text-blue-600">.lol</span></span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "font-medium text-blue-700 dark:text-blue-400"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="Refresh latest leaderboard"
            title="Refresh latest leaderboard"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-blue-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 12a8 8 0 0 0-14.93-4" />
              <path d="M4 4v4h4" />
              <path d="M4 12a8 8 0 0 0 14.93 4" />
              <path d="M20 20v-4h-4" />
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
