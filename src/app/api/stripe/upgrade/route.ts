import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Aucun abonnement actif trouvé" },
      { status: 404 },
    );
  }

  const newPriceId =
    billing === "yearly"
      ? process.env.STRIPE_MAX_YEARLYPRICE_ID!
      : process.env.STRIPE_MAX_MONTHLYPRICE_ID!;

  const subscription = await stripe.subscriptions.retrieve(
    user.stripeSubscriptionId,
  );

  const subscriptionItem = subscription.items.data[0];
  const prorationDate = Math.floor(Date.now() / 1000);

  // Calcule le prorata sans appliquer le changement
  const preview = await stripe.invoices.createPreview({
    customer: user.stripeCustomerId!,
    subscription: user.stripeSubscriptionId,
    subscription_details: {
      items: [{ id: subscriptionItem.id, price: newPriceId }],
      proration_date: prorationDate,
    },
  });

  // Montant total de la prochaine facture après prorata (en centimes)
  const nextTotal = preview.total;
  // Crédit issu de l'ancien plan (ligne de prorata négative)
  const creditLine = preview.lines.data.find((l) => (l.amount ?? 0) < 0);
  const creditAmount = creditLine ? Math.abs(creditLine.amount ?? 0) : 0;

  return NextResponse.json({
    prorationDate,
    nextTotal,       // montant final de la prochaine facture en centimes
    creditAmount,    // crédit déduit en centimes
    billing,
    subscriptionItemId: subscriptionItem.id,
    newPriceId,
  });
}
