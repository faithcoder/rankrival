export const DEFAULT_FREE_LISTING_UNTIL = "2026-08-23T19:04:51Z";

export function freeListingUntil(): string {
  return process.env.NEXT_PUBLIC_FREE_LISTING_UNTIL || DEFAULT_FREE_LISTING_UNTIL;
}

export function isFreeListingActive(now = Date.now()): boolean {
  const deadline = Date.parse(freeListingUntil());
  return Number.isFinite(deadline) && now < deadline;
}
