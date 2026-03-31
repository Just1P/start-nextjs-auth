"use client";

import { Button } from "@/app/ui/button";
import { useState } from "react";

const PLANS = {
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

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8l3.5 3.5L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SubscriptionButton({
  isSubscribed,
  isCanceling,
  currentPlan,
  currentBilling,
}: {
  isSubscribed: boolean;
  isCanceling: boolean;
  currentPlan: "premium" | "max" | null;
  currentBilling: "monthly" | "yearly" | null;
}) {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"premium" | "max">(
    "premium",
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradePreview, setUpgradePreview] = useState<{
    prorationDate: number;
    nextTotal: number;
    creditAmount: number;
    targetTier: "premium" | "max";
    targetBilling: "monthly" | "yearly";
    targetLabel: string;
    subscriptionItemId: string;
    newPriceId: string;
  } | null>(null);

  const handleCheckoutForTier = async (tier: "premium" | "max") => {
    setSelectedTier(tier);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stripe/checkout?plan=${billing}&tier=${tier}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePreview = async (
    tier: "premium" | "max",
    targetBilling: "monthly" | "yearly",
  ) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stripe/upgrade?tier=${tier}&billing=${targetBilling}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      setUpgradePreview(data);
      setShowUpgradeConfirm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradePreview) return;
    setLoading(true);
    setShowUpgradeConfirm(false);
    try {
      const res = await fetch("/api/stripe/upgrade-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upgradePreview),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        window.location.href = `/subscription-success?plan=${upgradePreview.targetTier}&billing=${upgradePreview.targetBilling}&upgrade=true`;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      await fetch("/api/stripe/cancel", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    const plan = PLANS[currentPlan ?? "premium"];
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {plan.name}
            </span>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
              Actif
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {showUpgradeConfirm && upgradePreview ? (
          <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Confirmer le passage au plan {upgradePreview.targetLabel}
            </p>
            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              Récapitulatif de votre prochaine facture
            </p>
            <div className="mb-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {upgradePreview.targetLabel}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {upgradePreview.targetBilling === "yearly"
                    ? PLANS[upgradePreview.targetTier].yearly.billed
                    : `${PLANS[upgradePreview.targetTier].monthly.price} / mois`}
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Crédit plan actuel
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  −{" "}
                  {(upgradePreview.creditAmount / 100)
                    .toFixed(2)
                    .replace(".", ",")}{" "}
                  €
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm font-semibold">
                <span className="text-zinc-900 dark:text-zinc-50">
                  À débiter maintenant
                </span>
                <span className="text-zinc-900 dark:text-zinc-50">
                  {upgradePreview.nextTotal <= 0
                    ? "0,00 €"
                    : `${(upgradePreview.nextTotal / 100).toFixed(2).replace(".", ",")} €`}
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Prochain renouvellement
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {upgradePreview.targetBilling === "yearly"
                    ? PLANS[upgradePreview.targetTier].yearly.billed
                    : `${PLANS[upgradePreview.targetTier].monthly.price} / mois`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleUpgradeConfirm}
                disabled={loading}
              >
                {loading ? "..." : "Confirmer l'upgrade"}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowUpgradeConfirm(false);
                  setUpgradePreview(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          (() => {
            const availableUpgrades: {
              tier: "premium" | "max";
              billing: "monthly" | "yearly";
            }[] = [];
            if (currentPlan === "premium" && currentBilling === "monthly") {
              availableUpgrades.push(
                { tier: "premium", billing: "yearly" },
                { tier: "max", billing: "monthly" },
                { tier: "max", billing: "yearly" },
              );
            } else if (
              currentPlan === "premium" &&
              currentBilling === "yearly"
            ) {
              availableUpgrades.push({ tier: "max", billing: "yearly" });
            } else if (currentPlan === "max" && currentBilling === "monthly") {
              availableUpgrades.push({ tier: "max", billing: "yearly" });
            }

            if (availableUpgrades.length === 0) return null;

            return (
              <div className="w-full flex flex-col gap-3">
                <div
                  className={`grid gap-3 ${availableUpgrades.length === 1 ? "grid-cols-1" : availableUpgrades.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
                >
                  {availableUpgrades.map(({ tier, billing: b }) => {
                    const p = PLANS[tier];
                    const pricing = p[b];
                    return (
                      <div
                        key={`${tier}-${b}`}
                        className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                          {p.name} {b === "yearly" ? "Annuel" : "Mensuel"}
                        </p>
                        <div className="mb-3">
                          {pricing.original && (
                            <p className="text-xs text-zinc-400 line-through">
                              {pricing.original}
                            </p>
                          )}
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            {pricing.price}
                            <span className="ml-1 text-xs font-normal text-zinc-500">
                              / mois
                            </span>
                          </p>
                          {pricing.billed && (
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {pricing.billed}
                            </p>
                          )}
                        </div>
                        <ul className="mb-4 flex flex-col gap-1.5">
                          {p.features.map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                            >
                              <CheckIcon />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleUpgradePreview(tier, b)}
                          disabled={loading}
                          className="mt-auto w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                        >
                          {loading
                            ? "Calcul en cours..."
                            : `Upgrade — ${pricing.price} / mois`}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Le crédit de votre plan actuel sera déduit de votre prochaine
                  facture.
                </p>
              </div>
            );
          })()
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleManage}
          disabled={loading}
        >
          {loading ? "Chargement..." : "Gérer mon abonnement"}
        </Button>

        {showConfirm ? (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="mb-3 text-sm text-red-700 dark:text-red-300">
              Confirmer l&apos;annulation ? Votre accès restera actif
              jusqu&apos;à la fin de la période.
            </p>
            <div className="flex gap-2">
              <Button
                variant="dangerFill"
                className="flex-1"
                onClick={handleCancel}
                disabled={loading}
              >
                Confirmer
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Retour
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="danger"
            className="w-full"
            onClick={() => setShowConfirm(true)}
          >
            Annuler l&apos;abonnement
          </Button>
        )}
      </div>
    );
  }

  if (isCanceling) {
    const plan = PLANS[currentPlan ?? "premium"];
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {plan.name}
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Résiliation prévue
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {plan.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500"
              >
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Votre abonnement sera résilié à la fin de la période en cours.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          onClick={() => setBilling("monthly")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            billing === "monthly"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            billing === "yearly"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          Annuel
          <span className="ml-1.5 rounded-full bg-zinc-900 px-1.5 py-0.5 text-xs text-white dark:bg-zinc-50 dark:text-zinc-900">
            −17%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["premium", "max"] as const).map((tier) => {
          const p = PLANS[tier];
          const pricing = p[billing];
          return (
            <div
              key={tier}
              className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                {p.name}
              </p>
              <div className="mb-3">
                <p
                  className={`text-xs text-zinc-400 line-through ${pricing.original ? "" : "invisible"}`}
                >
                  {pricing.original ?? "placeholder"}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {pricing.price}
                  <span className="ml-1 text-xs font-normal text-zinc-500">
                    / mois
                  </span>
                </p>
                <p
                  className={`mt-0.5 text-xs text-zinc-500 ${pricing.billed ? "" : "invisible"}`}
                >
                  {pricing.billed ?? "placeholder"}
                </p>
              </div>
              <ul className="mb-4 flex flex-col gap-1.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckoutForTier(tier)}
                disabled={loading}
                className="mt-auto w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
              >
                {loading && selectedTier === tier
                  ? "Redirection..."
                  : `Souscrire — ${pricing.price} / mois`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
