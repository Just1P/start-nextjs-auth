import {
  PLAN_LABELS,
  PRICE_MAP,
  getPlanKeyFromPriceId,
  type Billing,
  type PlanKey,
  type Tier,
} from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/stripe-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetTier = searchParams.get("tier") as Tier | null;
  const targetBilling = searchParams.get("billing") as Billing | null;

  if (!targetTier || !targetBilling) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 },
    );
  }

  const targetKey: PlanKey = `${targetTier}-${targetBilling}`;
  const newPriceId = PRICE_MAP[targetKey];
  if (!newPriceId) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const currentKey = getPlanKeyFromPriceId(user.stripePriceId ?? "");
  const currentBillingCycle = currentKey?.split("-")[1] as Billing | undefined;
  if (currentBillingCycle === "yearly" && targetBilling === "monthly") {
    return NextResponse.json(
      { error: "Impossible de passer d'annuel à mensuel" },
      { status: 400 },
    );
  }

  if (!user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif trouvé" },
      { status: 404 },
    );
  }

  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId,
  );
  const subscriptionItem = subscription.items.data[0];
  const prorationDate = Math.floor(Date.now() / 1000);

  const preview = await stripe.invoices.createPreview({
    customer: user.stripeCustomerId!,
    subscription: user.stripeSubscriptionId,
    subscription_details: {
      items: [{ id: subscriptionItem.id, price: newPriceId }],
      proration_date: prorationDate,
    },
  });

  const isCurrentSubscriptionProration = (
    l: (typeof preview.lines.data)[number],
  ) => {
    const p = l.parent;
    if (!p) return false;
    if (p.type === "subscription_item_details") {
      return (
        p.subscription_item_details?.proration === true &&
        p.subscription_item_details?.subscription_item === subscriptionItem.id &&
        l.period?.start === prorationDate
      );
    }
    return false;
  };

  const prorationLines = preview.lines.data.filter(
    isCurrentSubscriptionProration,
  );

const creditAmount = prorationLines
    .filter((l) => (l.amount ?? 0) < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount ?? 0), 0);
  const prorationDebit = prorationLines
    .filter((l) => (l.amount ?? 0) > 0)
    .reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const nextTotal = prorationDebit - creditAmount;

  return NextResponse.json({
    prorationDate,
    nextTotal,
    creditAmount,
    targetTier,
    targetBilling,
    targetLabel: PLAN_LABELS[targetKey],
    subscriptionItemId: subscriptionItem.id,
    newPriceId,
  });
}
