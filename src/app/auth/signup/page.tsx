"use client";

import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Créer un compte
        </h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" name="name" type="text" label="Nom" required />
          <Input id="email" name="email" type="email" label="Email" required />
          <Input
            id="password"
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

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Déjà un compte ?{" "}
          <Link href="/auth/signin" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
