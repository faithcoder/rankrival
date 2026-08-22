import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rules",
  description: "The listing, bidding, ranking, payment, and content rules for RankRival.",
  alternates: { canonical: "/rules" },
};

const sections = [
  { title: "How ranking works", items: [
    "New listings use whole US dollars: $5 minimum, $999,999 maximum, in $1 increments. Bids already on the board keep their amount until they raise or get outranked.",
    "Taking #1 costs at least $5 more than the current top bid. Paying less still places you at the highest rank that bid can secure. Equal bids stay in the order placed—the older bid ranks higher.",
    "Enter the same website or @handle again to raise that listing. The new bid must be at least $1 above its current bid, and you pay only the difference. Someone else cannot take your listing by paying only that difference.",
    "App Store, Play Store, GitHub, and similar platform links are identified by their path, so separate apps do not share a bid. Tracking query strings are ignored.",
    "Upvotes affect the Top Upvoted panel only. They never change Top Trend or paid leaderboard positions, which remain determined by hourly clicks and category bids respectively.",
    "Temporary promotions may waive payment for new listings. Promotional listings receive the advertised fixed bid amount; upgrading an existing listing still requires payment.",
  ]},
  { title: "What you can list", items: [
    "A product website or an X @handle.",
    "Chat and invite links are not allowed, including Telegram, WhatsApp, Discord, Messenger, Signal, and similar services. The board is for products and profiles, not group chats.",
    "Pornographic, NSFW, sexual-content, and adult-platform links are not allowed.",
    "Query parameters are stripped from listing links. Affiliate, referral, and tracking URLs will not work.",
    "Link shortener URLs are not allowed. A submitted short link may be replaced by its final destination.",
  ]},
  { title: "After you pay", items: [
    "Your listing is public. Clicks go to the URL or profile you submitted, with RankRival attribution added to the outbound URL.",
    "A completed, verified payment is what claims the rank.",
    "Payments are one-time and non-refundable except where required by law.",
  ]},
  { title: "How upvotes work", items: [
    "Visitors can upvote a listing without registering. RankRival stores a long-lived anonymous voter cookie so one browser can cast only one upvote per listing.",
    "Clicking an active upvote again removes it. Clearing cookies or using another browser may create another anonymous identity, so automated rate limits and abuse checks also apply.",
    "Top Upvoted favors newer upvotes over older votes. Upvotes do not affect Top Trend, category rank, bid price, or ownership of a listing.",
  ]},
];

export default function RulesPage() {
  return (
    <article className="mx-auto max-w-3xl py-12 sm:py-16">
      <header className="mb-12">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">RankRival policy</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Rules</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">RankRival is a public leaderboard. There are no ads, API keys, or revenue share. You pay to stand above everyone else. <strong className="text-slate-950 dark:text-white">Rank is the bid—nothing else.</strong></p>
      </header>
      <div className="space-y-12">
        {sections.map((section) => {
          const id = section.title.toLowerCase().replaceAll(" ", "-");
          return <section key={section.title} aria-labelledby={id}>
            <h2 id={id} className="text-2xl font-bold tracking-tight">{section.title}</h2>
            <ul className="mt-5 space-y-4">{section.items.map((item) => <li key={item} className="flex gap-3 text-base leading-7 text-slate-600 dark:text-slate-300"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" /><span>{item}</span></li>)}</ul>
          </section>;
        })}
      </div>
      <div className="mt-14 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/40"><p className="font-semibold">Ready to claim a position?</p><Link href="/" className="mt-2 inline-block text-sm font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">View the live leaderboard →</Link></div>
    </article>
  );
}
