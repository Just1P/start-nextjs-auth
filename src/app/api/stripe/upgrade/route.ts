import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const PRICE_MAP: Record<string, string> = {
  "premium-monthly": process.env.STRIPE_PREMIUM_MONTHLYPRICE_ID!,
  "premium-yearly": process.env.STRIPE_PREMIUM_YEARLYPRICE_ID!,
  "max-monthly": process.env.STRIPE_MAX_MONTHLYPRICE_ID!,
  "max-yearly": process.env.STRIPE_MAX_YEARLYPRICE_ID!,
};

const PLAN_LABELS: Record<string, string> = {
  "premium-monthly": "Premium mensuel",
  "premium-yearly": "Premium annuel",
  "max-monthly": "Max mensuel",
  "max-yearly": "Max annuel",
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetTier = searchParams.get("tier") as "premium" | "max" | null;
  const targetBilling = searchParams.get("billing") as
    | "monthly"
    | "yearly"
    | null;

  if (!targetTier || !targetBilling) {
    return NextResponse.json(
      { error: "Paramètres manquants" },
      { status: 400 },
    );
  }

  const targetKey = `${targetTier}-${targetBilling}`;
  const newPriceId = PRICE_MAP[targetKey];
  if (!newPriceId) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const currentPriceId = user?.stripePriceId;
  const currentKey = Object.entries(PRICE_MAP).find(
    ([, v]) => v === currentPriceId,
  )?.[0];
  const currentBillingCycle = currentKey?.split("-")[1] as
    | "monthly"
    | "yearly"
    | undefined;
  if (currentBillingCycle === "yearly" && targetBilling === "monthly") {
    return NextResponse.json(
      { error: "Impossible de passer d'annuel à mensuel" },
      { status: 400 },
    );
  }

  if (!user?.stripeSubscriptionId) {
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

  const isProration = (l: (typeof preview.lines.data)[number]) => {
    const p = l.parent;
    if (!p) return false;
    if (p.type === "invoice_item_details")
      return p.invoice_item_details?.proration ?? false;
    if (p.type === "subscription_item_details")
      return p.subscription_item_details?.proration ?? false;
    return false;
  };

  const prorationLines = preview.lines.data.filter(isProration);
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
