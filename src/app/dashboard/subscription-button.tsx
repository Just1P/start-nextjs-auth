"use client";

import { Button } from "@/app/ui/button";
import { CheckIcon } from "@/app/ui/icons";
import { PLANS, type Billing, type Tier } from "@/lib/plans";
import { useState } from "react";

type UpgradePreview = {
  prorationDate: number;
  nextTotal: number;
  creditAmount: number;
  targetTier: Tier;
  targetBilling: Billing;
  targetLabel: string;
  subscriptionItemId: string;
  newPriceId: string;
};

type AvailableUpgrade = { tier: Tier; billing: Billing };

function getAvailableUpgrades(
  currentPlan: Tier,
  currentBilling: Billing,
): AvailableUpgrade[] {
  if (currentPlan === "premium" && currentBilling === "monthly") {
    return [
      { tier: "premium", billing: "yearly" },
      { tier: "max", billing: "monthly" },
      { tier: "max", billing: "yearly" },
    ];
  }
  if (currentPlan === "premium" && currentBilling === "yearly") {
    return [{ tier: "max", billing: "yearly" }];
  }
  if (currentPlan === "max" && currentBilling === "monthly") {
    return [{ tier: "max", billing: "yearly" }];
  }
  return [];
}

// ─── Plan card (used in upgrade list + new subscription list) ─────────────────

function PlanCard({
  tier,
  billing,
  loading,
  onAction,
  actionLabel,
}: {
  tier: Tier;
  billing: Billing;
  loading: boolean;
  onAction: () => void;
  actionLabel: string;
}) {
  const plan = PLANS[tier];
  const pricing = plan[billing];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
        {plan.name} {billing === "yearly" ? "Annuel" : "Mensuel"}
      </p>
      <div className="mb-3">
        <p className={`text-xs text-zinc-400 line-through ${pricing.original ? "" : "invisible"}`}>
          {pricing.original ?? "placeholder"}
        </p>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {pricing.price}
          <span className="ml-1 text-xs font-normal text-zinc-500">/ mois</span>
        </p>
        <p className={`mt-0.5 text-xs text-zinc-500 ${pricing.billed ? "" : "invisible"}`}>
          {pricing.billed ?? "placeholder"}
        </p>
      </div>
      <ul className="mb-4 flex flex-col gap-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onAction}
        disabled={loading}
        className="mt-auto w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Upgrade confirmation panel ───────────────────────────────────────────────

function UpgradeConfirmPanel({
  preview,
  loading,
  onConfirm,
  onCancel,
}: {
  preview: UpgradePreview;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const plan = PLANS[preview.targetTier];
  const renewalLabel =
    preview.targetBilling === "yearly"
      ? plan.yearly.billed
      : `${plan.monthly.price} / mois`;

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Confirmer le passage au plan {preview.targetLabel}
      </p>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Récapitulatif de votre prochaine facture
      </p>
      <div className="mb-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">{preview.targetLabel}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{renewalLabel}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Crédit plan actuel</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            − {(preview.creditAmount / 100).toFixed(2).replace(".", ",")} €
          </span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm font-semibold">
          <span className="text-zinc-900 dark:text-zinc-50">À débiter maintenant</span>
          <span className="text-zinc-900 dark:text-zinc-50">
            {preview.nextTotal <= 0
              ? "0,00 €"
              : `${(preview.nextTotal / 100).toFixed(2).replace(".", ",")} €`}
          </span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Prochain renouvellement</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{renewalLabel}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? "..." : "Confirmer l'upgrade"}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

// ─── Cancel confirmation panel ────────────────────────────────────────────────

function CancelConfirmPanel({
  loading,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <p className="mb-3 text-sm text-red-700 dark:text-red-300">
        Confirmer l&apos;annulation ? Votre accès restera actif jusqu&apos;à la fin de la période.
      </p>
      <div className="flex gap-2">
        <Button variant="dangerFill" className="flex-1" onClick={onConfirm} disabled={loading}>
          Confirmer
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Retour
        </Button>
      </div>
    </div>
  );
}

// ─── Active subscription view ─────────────────────────────────────────────────

function ActiveSubscriptionView({
  currentPlan,
  currentBilling,
  loading,
  onManage,
  onUpgradePreview,
  onCancelRequest,
}: {
  currentPlan: Tier;
  currentBilling: Billing;
  loading: boolean;
  onManage: () => void;
  onUpgradePreview: (tier: Tier, billing: Billing) => void;
  onCancelRequest: () => void;
}) {
  const plan = PLANS[currentPlan];
  const upgrades = getAvailableUpgrades(currentPlan, currentBilling);
  const cols = upgrades.length === 1 ? "grid-cols-1" : upgrades.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</span>
          <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            Actif
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <CheckIcon />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {upgrades.length > 0 && (
        <div className="w-full flex flex-col gap-3">
          <div className={`grid gap-3 ${cols}`}>
            {upgrades.map(({ tier, billing }) => (
              <PlanCard
                key={`${tier}-${billing}`}
                tier={tier}
                billing={billing}
                loading={loading}
                onAction={() => onUpgradePreview(tier, billing)}
                actionLabel={loading ? "Calcul en cours..." : `Upgrade — ${PLANS[tier][billing].price} / mois`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            Le crédit de votre plan actuel sera déduit de votre prochaine facture.
          </p>
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={onManage} disabled={loading}>
        {loading ? "Chargement..." : "Gérer mon abonnement"}
      </Button>
      <Button variant="danger" className="w-full" onClick={onCancelRequest}>
        Annuler l&apos;abonnement
      </Button>
    </div>
  );
}

// ─── Canceling subscription view ──────────────────────────────────────────────

function CancelingSubscriptionView({ currentPlan }: { currentPlan: Tier }) {
  const plan = PLANS[currentPlan];
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Résiliation prévue
          </span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
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

// ─── New subscription view ────────────────────────────────────────────────────

function NewSubscriptionView({
  loading,
  onCheckout,
}: {
  loading: boolean;
  onCheckout: (tier: Tier, billing: Billing) => void;
}) {
  const [billing, setBilling] = useState<Billing>("monthly");

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
        {(["premium", "max"] as const).map((tier) => (
          <PlanCard
            key={tier}
            tier={tier}
            billing={billing}
            loading={loading}
            onAction={() => onCheckout(tier, billing)}
            actionLabel={
              loading
                ? "Redirection..."
                : `Souscrire — ${PLANS[tier][billing].price} / mois`
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export function SubscriptionButton({
  isSubscribed,
  isCanceling,
  currentPlan,
  currentBilling,
}: {
  isSubscribed: boolean;
  isCanceling: boolean;
  currentPlan: Tier | null;
  currentBilling: Billing | null;
}) {
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [upgradePreview, setUpgradePreview] = useState<UpgradePreview | null>(null);

  const handleCheckout = async (tier: Tier, billing: Billing) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stripe/checkout?plan=${billing}&tier=${tier}`, {
        method: "POST",
      });
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

  const handleUpgradePreview = async (tier: Tier, billing: Billing) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stripe/upgrade?tier=${tier}&billing=${billing}`, {
        method: "POST",
      });
      const data = await res.json();
      setUpgradePreview(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!upgradePreview) return;
    setLoading(true);
    setUpgradePreview(null);
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
    setShowCancelConfirm(false);
    try {
      await fetch("/api/stripe/cancel", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  if (isCanceling && currentPlan) {
    return <CancelingSubscriptionView currentPlan={currentPlan} />;
  }

  if (isSubscribed && currentPlan && currentBilling) {
    if (upgradePreview) {
      return (
        <UpgradeConfirmPanel
          preview={upgradePreview}
          loading={loading}
          onConfirm={handleUpgradeConfirm}
          onCancel={() => setUpgradePreview(null)}
        />
      );
    }

    if (showCancelConfirm) {
      return (
        <CancelConfirmPanel
          loading={loading}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      );
    }

    return (
      <ActiveSubscriptionView
        currentPlan={currentPlan}
        currentBilling={currentBilling}
        loading={loading}
        onManage={handleManage}
        onUpgradePreview={handleUpgradePreview}
        onCancelRequest={() => setShowCancelConfirm(true)}
      />
    );
  }

  return (
    <NewSubscriptionView
      loading={loading}
      onCheckout={handleCheckout}
    />
  );
}
