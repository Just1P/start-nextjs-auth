import { prisma } from "@/lib/db";
import { getPriceId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan") === "yearly" ? "yearly" : "monthly";
  const tier = searchParams.get("tier") === "max" ? "max" : "premium";

  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const priceId = getPriceId(tier, plan);

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription-success?plan=${tier}&billing=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
