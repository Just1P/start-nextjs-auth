import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  if (!user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif trouvé" },
      { status: 404 },
    );
  }

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeStatus: "cancel_at_period_end" },
  });

  return NextResponse.json({ success: true });
}
