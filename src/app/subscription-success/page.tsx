"use client";

import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const PLANS = {
  premium: { name: "Premium", monthly: "12,99 €", yearly: "129,99 €" },
  max: { name: "Max", monthly: "24,99 €", yearly: "224,91 €" },
};

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iconRef = useRef<HTMLDivElement>(null);

  const plan = (searchParams.get("plan") ?? "premium") as "premium" | "max";
  const billing = (searchParams.get("billing") ?? "monthly") as
    | "monthly"
    | "yearly";
  const isUpgrade = searchParams.get("upgrade") === "true";

  const planData = PLANS[plan] ?? PLANS.premium;
  const price = billing === "yearly" ? planData.yearly : planData.monthly;
  const billingLabel = billing === "yearly" ? "an" : "mois";

  useEffect(() => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Tir gauche
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x, y },
      colors: ["#18181b", "#52525b", "#a1a1aa", "#e4e4e7", "#ffffff"],
    });

    // Tir droit
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x, y },
      colors: ["#18181b", "#52525b", "#a1a1aa", "#e4e4e7", "#ffffff"],
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* Icône confetti */}
        <div className="mb-6 flex justify-center">
          <div
            ref={iconRef}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900"
          >
            <span className="text-3xl">🎉</span>
          </div>
        </div>

        {/* Message */}
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

        {/* Récap abonnement */}
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
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Montant
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {price} / {billingLabel}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Accéder au dashboard
        </Link>
      </div>
    </div>
  );
}
