import Stripe from "stripe";

let _stripe: Stripe | null | undefined;

export function isMockMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_PAYMENTS === "true";
}

export function getStripe(): Stripe | null {
  if (_stripe === undefined) {
    if (!process.env.STRIPE_SECRET_KEY) {
      _stripe = null;
    } else {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: "2025-02-24.acacia",
      });
    }
  }
  return _stripe;
}

export interface CheckoutParams {
  listingId: number;
  domain: string;
  chargeAmount: number;
  fullAmount: number;
  previousAmount: number;
}

export async function createCheckoutSession(
  params: CheckoutParams
): Promise<{ url: string; id: string }> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `RankRival — Rank for ${params.domain}`,
            description: "One-time payment to list your site on the leaderboard.",
          },
          unit_amount: params.chargeAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      listing_id: String(params.listingId),
      full_amount: String(params.fullAmount),
      previous_amount: String(params.previousAmount),
    },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?cancelled=1`,
  });

  return {
    url: session.url || `${siteUrl}/success?session_id=${session.id}`,
    id: session.id,
  };
}
