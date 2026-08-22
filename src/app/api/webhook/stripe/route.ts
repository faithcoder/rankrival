import { NextRequest } from "next/server";
import { getDb, finalizePayment, recalculateRanks } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: { type: string; data: { object: any } };

  const stripe = getStripe();

  if (stripe && webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      ) as { type: string; data: { object: any } };
    } catch (err) {
      return Response.json(
        { error: `Webhook signature verification failed` },
        { status: 400 }
      );
    }
  } else {
    return Response.json({ error: "Webhook verification is not configured" }, { status: 503 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const listingId = Number(metadata.listing_id);
    const fullAmount = Number(metadata.full_amount);
    const previousAmount = Number(metadata.previous_amount);

    if (!listingId || !Number.isInteger(fullAmount)) {
      return Response.json({ error: "Missing metadata" }, { status: 400 });
    }

    const db = getDb();
    if (session.payment_status !== "paid") return Response.json({ error: "Payment is not complete" }, { status: 400 });
    const finalized = finalizePayment(db, listingId, fullAmount, previousAmount, session.id);
    if (!finalized) return Response.json({ error: "Payment state does not match this listing" }, { status: 409 });
    recalculateRanks(db);

    return Response.json({ received: true });
  }

  return Response.json({ received: true });
}
