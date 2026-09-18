"use client";

import type { SortOption } from "@/lib/sort-filter";

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "cheapest", label: "Cheapest" },
  { value: "fastest", label: "Fastest" },
  { value: "fewest_stops", label: "Fewest stops" },
  { value: "departure_time", label: "Departure time" },
];

export function SortBar({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <div role="group" aria-label="Sort results" className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`min-h-9 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            value === opt.value
              ? "bg-brand text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
