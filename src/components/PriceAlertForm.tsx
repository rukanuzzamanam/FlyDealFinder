"use client";

import { useState } from "react";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { DEFAULT_ORIGIN, POPULAR_ORIGINS } from "@/lib/airports";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

type Status = "idle" | "submitting" | "success" | "error";

export function PriceAlertForm() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATIONS[0]?.airportCode ?? "");
  const [targetPrice, setTargetPrice] = useState(500);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, targetPrice, currency: "AUD", email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage(body.error ?? "Couldn't save your price alert. Please try again.");
        setStatus("error");
        return;
      }

      track({ name: "price_alert_created", origin, destination, targetPrice });
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <p className="font-semibold">You&apos;re all set!</p>
        <p className="text-sm">
          We&apos;ll email {email} when {origin} → {destination} drops to{" "}
          {formatPrice(targetPrice, "AUD")} or less.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        From
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="form-input">
          {POPULAR_ORIGINS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city} ({a.code})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        To
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="form-input"
        >
          {DEFAULT_DESTINATIONS.map((d) => (
            <option key={d.id} value={d.airportCode}>
              {d.city} ({d.airportCode})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        Target price (AUD)
        <input
          type="number"
          min={1}
          value={targetPrice}
          onChange={(e) => setTargetPrice(Number(e.target.value))}
          className="form-input"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        Email
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
      </label>

      {errorMessage && (
        <p role="alert" className="sm:col-span-2 text-sm font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-11 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60 sm:col-span-2 sm:w-auto"
      >
        {status === "submitting" ? "Saving…" : "Create Price Alert"}
      </button>
    </form>
  );
}
