export type Tier = "premium" | "max";
export type Billing = "monthly" | "yearly";
export type PlanKey = `${Tier}-${Billing}`;

export const PLANS: Record<
  Tier,
  {
    name: string;
    monthly: { price: string; billed: string | null; original: string | null };
    yearly: { price: string; billed: string | null; original: string | null };
    features: string[];
  }
> = {
  premium: {
    name: "Premium",
    monthly: { price: "12,99 €", billed: null, original: null },
    yearly: {
      price: "10,83 €",
      billed: "129,99 € facturé annuellement",
      original: "12,99 €",
    },
    features: [
      "1 canal monétisé",
      "Accès à toute la bibliothèque",
      "Licence commerciale incluse",
      "Mises à jour gratuites",
    ],
  },
  max: {
    name: "Max",
    monthly: { price: "24,99 €", billed: null, original: null },
    yearly: {
      price: "18,74 €",
      billed: "224,91 € facturé annuellement",
      original: "24,99 €",
    },
    features: [
      "Tout le plan Premium",
      "Jusqu'à 15 canaux monétisés",
      "Support prioritaire",
      "Requêtes personnalisées",
    ],
  },
};

export const PLAN_PRICES: Record<Tier, { monthly: string; yearly: string }> = {
  premium: { monthly: "12,99 €", yearly: "129,99 €" },
  max: { monthly: "24,99 €", yearly: "224,91 €" },
};

export const PRICE_MAP: Record<PlanKey, string> = {
  "premium-monthly": process.env.STRIPE_PREMIUM_MONTHLYPRICE_ID!,
  "premium-yearly": process.env.STRIPE_PREMIUM_YEARLYPRICE_ID!,
  "max-monthly": process.env.STRIPE_MAX_MONTHLYPRICE_ID!,
  "max-yearly": process.env.STRIPE_MAX_YEARLYPRICE_ID!,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  "premium-monthly": "Premium mensuel",
  "premium-yearly": "Premium annuel",
  "max-monthly": "Max mensuel",
  "max-yearly": "Max annuel",
};

export function getPriceId(tier: Tier, billing: Billing): string {
  return PRICE_MAP[`${tier}-${billing}`];
}

export function getPlanKeyFromPriceId(priceId: string): PlanKey | undefined {
  return (Object.entries(PRICE_MAP) as [PlanKey, string][]).find(
    ([, v]) => v === priceId,
  )?.[0];
}
