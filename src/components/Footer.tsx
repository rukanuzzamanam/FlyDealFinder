export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
        <p className="font-semibold text-slate-700 dark:text-slate-200">FlyDealFinder</p>
        <p>Find cheap flights anywhere in the world.</p>
        <p className="mt-2 text-xs">
          Prices are provided by our flight search partner and may change before booking.
          &copy; {new Date().getFullYear()} FlyDealFinder.
        </p>
      </div>
    </footer>
  );
}
