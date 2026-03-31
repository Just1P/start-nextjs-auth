import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const {
    subscriptionItemId,
    newPriceId,
    prorationDate,
    nextTotal,
    targetTier,
    targetBilling,
    targetLabel,
  } = await request.json();

  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  if (!user.stripeSubscriptionId || !user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif trouvé" },
      { status: 404 },
    );
  }

  if (nextTotal <= 0) {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ id: subscriptionItemId, price: newPriceId }],
      proration_behavior: "create_prorations",
      proration_date: prorationDate,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { stripePriceId: newPriceId },
    });
    return NextResponse.json({ success: true, targetTier, targetBilling });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Upgrade vers ${targetLabel}`,
            description: `Prorata pour le passage au plan ${targetLabel}`,
          },
          unit_amount: nextTotal,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "upgrade",
      subscriptionId: user.stripeSubscriptionId,
      subscriptionItemId,
      newPriceId,
      prorationDate: String(prorationDate),
      userId: user.id,
      targetTier,
      targetBilling,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription-success?plan=${targetTier}&billing=${targetBilling}&upgrade=true&prorataAmount=${nextTotal}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
