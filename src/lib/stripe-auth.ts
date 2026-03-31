import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeStatus: string | null;
};

type AuthResult =
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: NextResponse };

export async function getAuthenticatedUser(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      user: null,
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      ),
    };
  }

  return { user, error: null };
}
