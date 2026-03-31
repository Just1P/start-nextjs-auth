import { getPriceId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  if (!user.stripeSubscriptionId || !user.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 404 });
  }

  const newPriceId = getPriceId("max", "yearly");

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: newPriceId, quantity: 1 }],
    metadata: { upgradeFrom: user.stripeSubscriptionId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription-success?plan=max&billing=yearly&upgrade=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
