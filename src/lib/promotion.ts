export function isFreeListingActive(): boolean {
  return process.env.NEXT_PUBLIC_FREE_LISTINGS !== "false";
}
