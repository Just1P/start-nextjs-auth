import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const { subscriptionItemId, newPriceId, prorationDate } = await request.json();

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.stripeSubscriptionId) {
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
