"use client";

import { Button } from "@/app/ui/button";
import { PLAN_PRICES, PLANS, type Billing, type Tier } from "@/lib/plans";
import confetti from "canvas-confetti";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iconRef = useRef<HTMLDivElement>(null);

  const plan = (searchParams.get("plan") ?? "premium") as Tier;
  const billing = (searchParams.get("billing") ?? "monthly") as Billing;
  const isUpgrade = searchParams.get("upgrade") === "true";
  const prorataAmountCents = searchParams.get("prorataAmount");
  const prorataAmount = prorataAmountCents
    ? (Number(prorataAmountCents) / 100).toFixed(2).replace(".", ",") + " €"
    : null;

  const planData = PLANS[plan] ?? PLANS.premium;
  const price = PLAN_PRICES[plan][billing];
  const billingLabel = billing === "yearly" ? "an" : "mois";

  useEffect(() => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x, y },
      colors: [
        "#ff6b6b",
        "#ffd93d",
        "#6bcb77",
        "#4d96ff",
        "#ff6bff",
        "#ffb347",
      ],
    });

    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x, y },
      colors: [
        "#ff6b6b",
        "#ffd93d",
        "#6bcb77",
        "#4d96ff",
        "#ff6bff",
        "#ffb347",
      ],
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex justify-center">
          <div
            ref={iconRef}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900"
          >
            <span className="text-3xl">🎉</span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isUpgrade ? "Upgrade confirmé !" : "Abonnement activé !"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {isUpgrade
              ? `Vous êtes maintenant sur le plan ${planData.name}.`
              : `Bienvenue sur le plan ${planData.name}. Votre accès est actif.`}
          </p>
        </div>

        <div className="mb-8 divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Plan
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
              {planData.name}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Facturation
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 capitalize">
              {billing === "yearly" ? "Annuelle" : "Mensuelle"}
            </span>
          </div>
          {isUpgrade && prorataAmount ? (
            <>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Débité maintenant
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {prorataAmount}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Prochain renouvellement
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {price} / {billingLabel}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Montant
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {price} / {billingLabel}
              </span>
            </div>
          )}
        </div>

        <Button className="w-full" onClick={() => router.push("/dashboard")}>
          Accéder au dashboard
        </Button>
      </div>
    </div>
  );
}
