export function LoadingState({ anywhere = false }: { anywhere?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">
        {anywhere ? "🌎" : "✈️"}
      </span>
      <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
        {anywhere ? "Checking destinations..." : "Searching thousands of flight options..."}
      </p>
      <div className="flex w-full max-w-2xl flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
