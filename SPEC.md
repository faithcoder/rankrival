# RankRival — Paid Public Leaderboard

A clone of outbid.lol where people bid real money to rank their product/website/profile on a public board. Higher bid = higher rank. Visitors click through, giving advertisers real traffic.

## Tech Stack
- Next.js 15+ (App Router, Turbopack)
- Tailwind CSS v4
- TypeScript
- DM Sans (body) + Geist Mono (monospace/numbers) via next/font
- Stripe for payments (Checkout Sessions)
- SQLite via better-simqlite3 (simple, no external DB needed)
- Real-time: polling every 15s + Server-Sent Events
- Deploy-ready for Vercel

## Pages

### Homepage (/)
1. **Header**: Logo "rankrival.lol", nav (Leaderboard, About, Rules), dark/light toggle
2. **Stats banner**: "{N} online · {N} visitors since launch · see stats→"
3. **Hero bid section**: "Claim #1 for ${amount}" with −/+ stepper, URL input, "Outbid" button
4. **Trending**: Top 5 by clicks/hour with favicon, domain, clicks/h
5. **Latest activity**: Last 5 bids with favicon, domain, rank, price, time ago
6. **Leaderboard**: All listings sorted by bid desc. Top 3 visually distinct. Each card: rank, favicon, domain, price, description, time ago, clicks, "claim this rank" button
7. **Footer**: credits, links

### About (/about), Rules (/rules), Stats (/stats)

## Database (SQLite)

listings: id, url, domain, handle, description, bid_amount, clicks, clicks_this_hour, rank, created_at, updated_at, stripe_session_id, paid

bid_events: id, listing_id, amount, previous_amount, created_at

click_events: id, listing_id, created_at, referrer

site_stats: id, total_visitors, total_revenue, updated_at

## API Routes (Next.js Route Handlers)

- POST /api/outbid — create Stripe checkout session
- GET /api/listings — all paid listings by rank
- GET /api/trending — top 5 by clicks_this_hour
- GET /api/activity — last 5 bid events
- GET /api/stats — aggregate stats
- GET /api/favicon?domain= — proxy favicon fetcher with 24h cache
- GET /api/redirect?to= — click tracking redirect (302)
- POST /api/webhook/stripe — payment confirmation
- GET /api/online — online visitor count

## Bidding Rules
- Min $5, max $999,999, $1 increments
- Rank = bid amount desc. Equal bids: older wins.
- #1 requires $5+ more than current top
- Re-entering same URL: only pay the difference
- Different user must exceed your bid to take your rank

## Design
- Light: white bg, dark text. Dark: near-black bg, light text
- DM Sans body, Geist Mono for numbers
- Max-width ~900px centered, mobile-first
- Top 3: gold/silver/bronze accent
- Subtle shadows, rounded corners, generous whitespace
- Smooth transitions for dark mode and number changes

See SPEC_PART2.md for implementation details.
