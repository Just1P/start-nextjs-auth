import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SubscriptionButton } from "./subscription-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { stripeStatus: true, stripePriceId: true },
  });

  const stripeStatus = user?.stripeStatus ?? null;
  const isSubscribed = stripeStatus === "active" || stripeStatus === "trialing";
  const isCanceling = stripeStatus === "cancel_at_period_end";

  const maxMonthlyId = process.env.STRIPE_MAX_MONTHLYPRICE_ID;
  const maxYearlyId = process.env.STRIPE_MAX_YEARLYPRICE_ID;
  const premiumYearlyId = process.env.STRIPE_PREMIUM_YEARLYPRICE_ID;

  const priceId = user?.stripePriceId ?? "";
  const isMaxPlan = priceId === maxMonthlyId || priceId === maxYearlyId;

  const currentPlan: "premium" | "max" | null =
    isSubscribed || isCanceling ? (isMaxPlan ? "max" : "premium") : null;

  const currentBilling: "monthly" | "yearly" | null =
    isSubscribed || isCanceling
      ? priceId === maxYearlyId || priceId === premiumYearlyId
        ? "yearly"
        : "monthly"
      : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Bonjour, {session.user.name}
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
          <p className="mt-0.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {session.user.email}
          </p>
        </div>

        <div className="mt-auto">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Abonnement
        </h2>
        <SubscriptionButton
          isSubscribed={isSubscribed}
          isCanceling={isCanceling}
          currentPlan={currentPlan}
          currentBilling={currentBilling}
        />
      </main>
    </div>
  );
}
