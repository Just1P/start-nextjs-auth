"use client";

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

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-800";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            onClick={() => {
              setTab("signin");
              setError("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "signin"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "signup"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
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
            <div>
              <label
                htmlFor="signin-email"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="signin-password"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Mot de passe
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        )}

        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="signup-name"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Nom
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="signup-email"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="signup-password"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Mot de passe
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={6}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500">Minimum 6 caractères</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Création..." : "Créer un compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
