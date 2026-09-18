"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterAirportOptions, formatAirportLabel } from "@/lib/airport-search";
import type { AirportOption } from "@/lib/airport-search";

interface AirportComboboxProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  options: AirportOption[];
  /** An extra option pinned to the top of the list, e.g. "🌎 Anywhere". */
  pinnedOption?: AirportOption;
  placeholder?: string;
}

/**
 * Accessible typeahead combobox for picking an airport/destination from a
 * fixed in-memory list (see `src/lib/airports.ts` / `src/lib/destinations.ts`
 * — no external airport database). Shows "City — CODE, Country" once a value
 * is selected; typing re-opens the list filtered by `filterAirportOptions`.
 */
export function AirportCombobox({
  label,
  value,
  onChange,
  options,
  pinnedOption,
  placeholder,
}: AirportComboboxProps) {
  const allOptions = useMemo(
    () => (pinnedOption ? [pinnedOption, ...options] : options),
    [pinnedOption, options]
  );
  const selected = allOptions.find((o) => o.code === value);

  const [query, setQuery] = useState(selected ? formatAirportLabel(selected) : "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Keep the displayed text in sync when `value` changes from outside
  // (e.g. the swap-origin/destination button) — an intentional sync with an
  // external source of truth (the `value` prop), not derivable render state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(selected ? formatAirportLabel(selected) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync on value changes
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(selected ? formatAirportLabel(selected) : "");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  });

  const isTyping = isOpen && query !== (selected ? formatAirportLabel(selected) : "");
  const results = isTyping ? filterAirportOptions(allOptions, query) : allOptions;

  function selectOption(option: AirportOption) {
    onChange(option.code);
    setQuery(formatAirportLabel(option));
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = results[activeIndex];
      if (option) selectOption(option);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery(selected ? formatAirportLabel(selected) : "");
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={listboxId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={listboxId}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${listboxId}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        className="form-input"
        placeholder={placeholder}
        value={query}
        onFocus={() => {
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <ul
          id={`${listboxId}-list`}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No matches</li>
          ) : (
            results.map((option, index) => (
              <li
                key={option.code}
                role="option"
                aria-selected={option.code === value}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex
                    ? "bg-brand/10 text-brand-dark dark:text-white"
                    : "text-slate-700 dark:text-slate-200"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.emoji ? <span aria-hidden="true">{option.emoji} </span> : null}
                {formatAirportLabel(option)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
