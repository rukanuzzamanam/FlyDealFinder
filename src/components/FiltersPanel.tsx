"use client";

import type { DepartureWindow, FlightFilters } from "@/lib/sort-filter";

interface FiltersPanelProps {
  filters: FlightFilters;
  onChange: (filters: FlightFilters) => void;
  airlines: Array<{ code: string; name: string }>;
  maxPossiblePrice: number;
}

const STOP_OPTIONS: Array<{ value: 0 | 1 | 2; label: string }> = [
  { value: 0, label: "Direct" },
  { value: 1, label: "1 stop" },
  { value: 2, label: "2+ stops" },
];

const WINDOW_OPTIONS: Array<{ value: DepartureWindow; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

export function FiltersPanel({ filters, onChange, airlines, maxPossiblePrice }: FiltersPanelProps) {
  const ceiling = Math.max(maxPossiblePrice, 100);

  function toggleStop(value: 0 | 1 | 2) {
    const current = filters.stops ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, stops: next });
  }

  function toggleAirline(code: string) {
    const current = filters.airlineCodes ?? [];
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    onChange({ ...filters, airlineCodes: next });
  }

  function toggleWindow(value: DepartureWindow) {
    const current = filters.departureWindows ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, departureWindows: next });
  }

  return (
    <section aria-label="Filters" className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Price</h3>
        <input
          type="range"
          min={0}
          max={ceiling}
          step={10}
          value={filters.maxPrice ?? ceiling}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand"
          aria-label="Maximum price"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Up to ${filters.maxPrice ?? ceiling}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Stops</h3>
        <div className="flex flex-col gap-2">
          {STOP_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={filters.stops?.includes(opt.value) ?? false}
                onChange={() => toggleStop(opt.value)}
                className="h-4 w-4 accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Departure time</h3>
        <div className="flex flex-col gap-2">
          {WINDOW_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={filters.departureWindows?.includes(opt.value) ?? false}
                onChange={() => toggleWindow(opt.value)}
                className="h-4 w-4 accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {airlines.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Airlines</h3>
          <div className="flex flex-col gap-2">
            {airlines.map((a) => (
              <label key={a.code} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filters.airlineCodes?.includes(a.code) ?? false}
                  onChange={() => toggleAirline(a.code)}
                  className="h-4 w-4 accent-brand"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
