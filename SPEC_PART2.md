# Implementation Details

## Project Structure
```
rankrival/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts, dark mode
│   │   ├── page.tsx            # Homepage (leaderboard)
│   │   ├── about/page.tsx
│   │   ├── rules/page.tsx
│   │   ├── stats/page.tsx
│   │   ├── success/page.tsx    # Post-payment success
│   │   └── api/
│   │       ├── outbid/route.ts
│   │       ├── listings/route.ts
│   │       ├── trending/route.ts
│   │       ├── activity/route.ts
│   │       ├── stats/route.ts
│   │       ├── favicon/route.ts
│   │       ├── redirect/route.ts
│   │       ├── online/route.ts
│   │       └── webhook/stripe/route.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── BidSection.tsx
│   │   ├── TrendingBar.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── LeaderboardCard.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── StatsBanner.tsx
│   ├── lib/
│   │   ├── db.ts               # SQLite setup + schema
│   │   ├── stripe.ts           # Stripe client
│   │   └── utils.ts            # Helpers (format money, time ago, etc)
│   └── hooks/
│       └── usePolling.ts       # Polling hook for real-time updates
├── public/
├── SPEC.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Key Implementation Notes

### Favicon Proxy (/api/favicon)
- Try fetching https://{domain}/favicon.ico
- Fall back to Google: https://www.google.com/s2/favicons?domain={domain}&sz=32
- Cache responses in a Map or SQLite for 24 hours
- Return the image with proper content-type

### Click Tracking (/api/redirect)
- Accept `to` query param
- Look up listing by URL
- Increment listing.clicks and listing.clicks_this_hour
- Insert into click_events
- 302 redirect to the actual URL

### Stripe Webhook
- Verify webhook signature
- On checkout.session.completed:
  - Extract listing_id from metadata
  - Mark listing as paid = true
  - Recalculate ALL ranks: ORDER BY bid_amount DESC, created_at ASC
  - Update site_stats.total_revenue

### Rank Recalculation
```sql
SELECT id FROM listings WHERE paid = 1 ORDER BY bid_amount DESC, created_at ASC
```
Loop results, assign rank 1, 2, 3...

### Online Count
- Frontend sends POST /api/online every 30s with a anonymous session ID (stored in localStorage)
- Backend keeps a Map<sessionId, lastSeen>
- Count entries where lastSeen > Date.now() - 60000
- Return count

### Dark Mode
- Use next-themes package
- Toggle button in header
- Persist in localStorage

### Real-time Updates
- Frontend polls /api/listings, /api/trending, /api/activity every 15 seconds
- Use SWR or custom fetch with interval
- Smooth number transitions with CSS

### Seed Data
Create 5-10 fake listings on first run so the board isn't empty:
- Use real-looking SaaS domains
- Bids ranging from $5 to $50
- Fake descriptions
- Set paid = true

### Environment Variables (.env.local)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For development without real Stripe, create a mock mode that auto-approves payments.
