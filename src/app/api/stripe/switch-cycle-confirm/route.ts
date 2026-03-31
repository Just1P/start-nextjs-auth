import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { subscriptionItemId, newPriceId, prorationDate } = await request.json();

  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  if (!user.stripeSubscriptionId) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 404 });
  }

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items: [{ id: subscriptionItemId, price: newPriceId }],
    proration_behavior: "create_prorations",
    proration_date: prorationDate,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripePriceId: newPriceId },
  });

  return NextResponse.json({ success: true });
}
