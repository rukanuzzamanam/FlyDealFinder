"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { NEWSLETTER_PREFERENCES } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

interface NewsletterFormProps {
  /** "full" shows region/interest preferences (homepage section); "compact" is email-only (footer). */
  variant?: "full" | "compact";
}

export function NewsletterForm({ variant = "full" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function togglePreference(pref: string) {
    setPreferences((current) =>
      current.includes(pref) ? current.filter((p) => p !== pref) : [...current, pref]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error ?? "Couldn't save your subscription. Please try again.");
        setStatus("error");
        return;
      }

      track({ name: "newsletter_signup", preferenceCount: preferences.length });
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
        You&apos;re subscribed! We&apos;ll send you cheap-flight deals when they&apos;re available.
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input sm:max-w-xs"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-11 shrink-0 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {status === "submitting" ? "Subscribing…" : "Subscribe"}
        </button>
        {errorMessage && (
          <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-11 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {status === "submitting" ? "Subscribing…" : "Get Cheap Flight Deals"}
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          What deals do you want to hear about? (optional)
        </legend>
        <div className="flex flex-wrap gap-2">
          {NEWSLETTER_PREFERENCES.map((pref) => (
            <label
              key={pref}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                preferences.includes(pref)
                  ? "border-brand bg-brand/10 text-brand-dark dark:text-white"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={preferences.includes(pref)}
                onChange={() => togglePreference(pref)}
              />
              {pref}
            </label>
          ))}
        </div>
      </fieldset>

      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Unsubscribe anytime. See our{" "}
        <a href="/privacy" className="underline hover:text-brand">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
