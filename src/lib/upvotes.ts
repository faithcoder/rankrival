import { createHmac } from "crypto";

export const VOTER_COOKIE = "rankrival_voter";

export function voterHash(visitorId: string): string {
  const secret = process.env.VOTER_HASH_SECRET || process.env.NEXTAUTH_SECRET || "rankrival-local-voter-secret";
  return createHmac("sha256", secret).update(visitorId).digest("hex");
}

export function validVisitorId(value?: string): value is string {
  return typeof value === "string" && /^[a-f0-9-]{20,80}$/i.test(value);
}
