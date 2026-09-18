export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">Last updated: {updated}</p>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_a]:text-brand [&_a]:underline [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5 dark:text-slate-300 dark:[&_h2]:text-white">
        {children}
      </div>
    </div>
  );
}
