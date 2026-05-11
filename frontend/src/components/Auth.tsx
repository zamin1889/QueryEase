import { type FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;
  const heading = isLogin ? "Welcome back" : "Create your account";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin((current) => !current);
    setErrorMessage(null);
  };

  return (
    <div className="theme min-h-screen w-full grid md:grid-cols-2 font-sans">
      <section className="flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="px-8 pt-8 md:px-10 md:pt-10">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-600 dark:text-zinc-400">
            QueryEase
          </span>
        </div>

        <div className="flex flex-1 items-center px-8 pb-6 md:px-10">
          <div className="w-full max-w-md">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {heading}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {isLogin
                  ? "Sign in to continue exploring your data."
                  : "Join QueryEase to unlock private, schema-aware insights."}
              </p>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-100"
              >
                {errorMessage}
              </div>
            ) : null}

            <form className="grid gap-3" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label
                  htmlFor="auth-email"
                  className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500"
                >
                  Email
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl border-zinc-200 bg-white text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-white/10"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="auth-password"
                  className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-zinc-200 bg-white pr-10 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="h-10 w-full rounded-xl bg-zinc-900 text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {isLogin ? "Signing in" : "Creating account"}
                  </span>
                ) : isLogin ? (
                  "Log In"
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              {isLogin ? "New to QueryEase?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-medium text-zinc-900 transition hover:underline dark:text-white"
                disabled={isLoading}
              >
                {isLogin ? "Create account" : "Log in"}
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 md:px-10">
          <p className="text-[0.7rem] leading-relaxed text-zinc-400">
            By clicking continue, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </section>

      <section className="relative hidden md:flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(251,146,60,0.18),transparent_60%),radial-gradient(850px_circle_at_85%_0%,rgba(251,113,133,0.14),transparent_55%),linear-gradient(180deg,rgba(244,238,230,0.96),rgba(250,248,245,0.96))] opacity-100 blur-3xl dark:opacity-0" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(251,146,60,0.14),transparent_55%),radial-gradient(800px_circle_at_85%_-10%,rgba(251,113,133,0.12),transparent_45%),linear-gradient(180deg,rgba(9,9,11,0.98),rgba(24,24,27,0.96))] opacity-0 blur-3xl dark:opacity-100" />
        </div>

        <div className="relative z-10 w-full max-w-md px-8">
          <div className="flex items-center gap-3 rounded-full border border-white/30 bg-white/40 px-4 py-3 shadow-2xl shadow-black/15 backdrop-blur-md">
            <Input
              type="text"
              placeholder="Ask a question about your database..."
              readOnly
              tabIndex={-1}
              className="h-9 border-0 bg-transparent px-0 text-sm text-zinc-700 placeholder:text-zinc-500 focus-visible:ring-0"
            />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white shadow-md shadow-black/30"
              aria-hidden="true"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
