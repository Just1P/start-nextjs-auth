import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === "upgrade") {
        const { subscriptionId, subscriptionItemId, newPriceId, userId } =
          session.metadata;
        const updated = await stripe.subscriptions.update(subscriptionId, {
          items: [{ id: subscriptionItemId, price: newPriceId }],
          proration_behavior: "none",
        });
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripePriceId: newPriceId,
            stripeSubscriptionId: updated.id,
            stripeStatus: updated.status,
          },
        });
        break;
      }

      if (session.subscription && session.customer) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const upgradeFrom = session.metadata?.upgradeFrom;
        if (upgradeFrom && upgradeFrom !== subscription.id) {
          await stripe.subscriptions.cancel(upgradeFrom);
        }

        await prisma.user.update({
          where: { stripeCustomerId: session.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeStatus: subscription.status,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const isCanceling =
        subscription.cancel_at_period_end || subscription.cancel_at !== null;
      const status = isCanceling ? "cancel_at_period_end" : subscription.status;
      await prisma.user.update({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeStatus: status,
          stripePriceId: subscription.items.data[0]?.price.id ?? null,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripeStatus: "canceled",
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
