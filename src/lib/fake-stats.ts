// Fake stats module — generates realistic-looking visitor/online numbers
// that grow over time. Replace with real data once the site gets traction.

const LAUNCH_DATE = new Date("2026-08-22T00:00:00Z");
const BASE_VISITORS = 3400; // Starting visitor count
const VISITORS_PER_DAY = 120; // Average new visitors per day
const ONLINE_MIN = 420;
const ONLINE_MAX = 980;

// Seed-based pseudo-random for consistent results within a time window
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/**
 * Get fake visitor count. Starts at ~3,400 and grows ~100-150/day.
 * Changes every 5 minutes (stable within that window).
 */
export function getFakeVisitors(): number {
  const now = Date.now();
  const fiveMinWindow = Math.floor(now / (5 * 60 * 1000));
  const daysSinceLaunch = (now - LAUNCH_DATE.getTime()) / (24 * 60 * 60 * 1000);

  // Base growth
  const growth = Math.floor(daysSinceLaunch * VISITORS_PER_DAY);

  // Add some daily variance (±20%)
  const daySeed = Math.floor(daysSinceLaunch);
  const dailyVariance = 1 + (seededRandom(daySeed) - 0.5) * 0.4;

  // Small 5-minute jitter (±30 visitors)
  const jitter = Math.floor(seededRandom(fiveMinWindow) * 60) - 30;

  const total = Math.floor(BASE_VISITORS + growth * dailyVariance) + jitter;
  return Math.max(BASE_VISITORS, total);
}

/**
 * Get fake online count. Always between 400-1000.
 * Changes every 5 minutes with natural-feeling fluctuation.
 */
export function getFakeOnline(): number {
  const now = Date.now();
  const fiveMinWindow = Math.floor(now / (5 * 60 * 1000));

  // Base: sine wave for time-of-day pattern (peaks at ~2pm UTC, trough at ~4am UTC)
  const hourOfDay = (now / (60 * 60 * 1000)) % 24;
  const timeOfDayFactor = 0.5 + 0.5 * Math.sin(((hourOfDay - 4) / 24) * 2 * Math.PI);

  // Map to range
  const base = ONLINE_MIN + (ONLINE_MAX - ONLINE_MIN) * timeOfDayFactor;

  // Add 5-minute jitter (±80)
  const jitter = (seededRandom(fiveMinWindow) - 0.5) * 160;

  const online = Math.floor(base + jitter);
  return Math.max(ONLINE_MIN, Math.min(ONLINE_MAX, online));
}
