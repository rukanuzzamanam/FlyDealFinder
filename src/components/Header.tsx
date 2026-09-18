import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <span aria-hidden="true">✈️</span>
          <span>
            Fly<span className="text-brand">Deal</span>Finder
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/search" className="hover:text-brand">
            Search
          </Link>
          <Link href="/#price-alerts" className="hover:text-brand">
            Price Alerts
          </Link>
        </nav>
      </div>
    </header>
  );
}
