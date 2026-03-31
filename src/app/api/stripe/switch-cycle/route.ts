import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif" },
      { status: 404 },
    );
  }

  const newPriceId = process.env.STRIPE_MAX_YEARLYPRICE_ID!;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId!,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: newPriceId, quantity: 1 }],
    metadata: { upgradeFrom: user.stripeSubscriptionId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription-success?plan=max&billing=yearly&upgrade=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
