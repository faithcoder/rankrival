import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Stats",
  description: "Live RankRival leaderboard traffic, clicks, revenue, listings, and referral analytics.",
  alternates: { canonical: "/stats" },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
