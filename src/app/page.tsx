"use client";

import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session?.user) return null;

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          <button onClick={() => { setTab("signin"); setError(""); }} className={tabClass(tab === "signin")}>
            Connexion
          </button>
          <button onClick={() => { setTab("signup"); setError(""); }} className={tabClass(tab === "signup")}>
            Inscription
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <Input id="signin-email" name="email" type="email" label="Email" required />
            <Input id="signin-password" name="password" type="password" label="Mot de passe" required />
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        )}

        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <Input id="signup-name" name="name" type="text" label="Nom" required />
            <Input id="signup-email" name="email" type="email" label="Email" required />
            <Input
              id="signup-password"
              name="password"
              type="password"
              label="Mot de passe"
              required
              minLength={6}
              hint="Minimum 6 caractères"
            />
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Création..." : "Créer un compte"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
