"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/deals", label: "Deals" },
  { href: "/explore", label: "Explore" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <span aria-hidden="true">✈️</span>
          <span>
            Fly<span className="text-brand">Deal</span>Finder
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300"
        >
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span aria-hidden="true" className="text-xl">
            {isMenuOpen ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 sm:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
