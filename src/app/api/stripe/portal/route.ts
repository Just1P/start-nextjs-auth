import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Aucun abonnement trouvé" },
      { status: 404 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
