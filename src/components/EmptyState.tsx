export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
      <span className="text-4xl" aria-hidden="true">
        🧭
      </span>
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
