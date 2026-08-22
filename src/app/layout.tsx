import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rankrival.lol"),
  title: { default: "RankRival — The live paid leaderboard", template: "%s | RankRival" },
  description:
    "Bid real money to rank your product, website, or profile on a public leaderboard. Higher bid, higher rank.",
  alternates: { canonical: "/" },
  keywords: ["product leaderboard", "startup leaderboard", "paid leaderboard", "discover products", "RankRival"],
  authors: [{ name: "RankRival", url: "https://rankrival.lol" }],
  creator: "RankRival",
  publisher: "RankRival",
  openGraph: { type: "website", siteName: "RankRival", title: "RankRival — The live paid leaderboard", description: "Discover products ranked transparently by their live bid.", url: "/" },
  twitter: { card: "summary", title: "RankRival — The live paid leaderboard", description: "Discover products ranked transparently by their live bid." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "RankRival", url: "https://rankrival.lol", description: "A transparent paid public leaderboard for products and profiles." }).replace(/</g, "\\u003c") }} />
        <Providers>
          <Header />
          <main className="mx-auto max-w-[1220px] px-4">{children}</main>
          <footer className="mx-auto max-w-[1220px] px-4 pb-10 pt-14">
            <div className="flex flex-col items-start justify-between gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500 sm:flex-row sm:items-center">
              <span>
                © {new Date().getFullYear()} rankrival.lol — the live paid leaderboard.
              </span>
              <span className="flex gap-4">
                <Link href="/about" className="hover:text-neutral-700 dark:hover:text-neutral-300">
                  About
                </Link>
                <Link href="/rules" className="hover:text-neutral-700 dark:hover:text-neutral-300">
                  Rules
                </Link>
                <Link href="/stats" className="hover:text-neutral-700 dark:hover:text-neutral-300">
                  Stats
                </Link>
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
