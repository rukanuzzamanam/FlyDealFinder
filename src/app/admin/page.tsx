import type { Metadata } from "next";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { getActiveDestinations } from "@/lib/db/destinations";
import { isDatabaseConfigured } from "@/lib/db/supabase";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Minimal admin foundation: destination list + config status. Intentionally
 * read-only for the MVP (section 25) — editing destinations, featured
 * deals, and search statistics can be layered onto this same page once the
 * database is provisioned.
 */
export default async function AdminPage() {
  const destinations = await getActiveDestinations();
  const dbConfigured = isDatabaseConfigured();
  const duffelConfigured = Boolean(process.env.DUFFEL_API_TOKEN);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Admin</h1>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard label="Duffel API" ok={duffelConfigured} />
        <StatusCard label="Database" ok={dbConfigured} />
        <StatusCard label="Destinations" ok value={String(destinations.length)} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Destinations {dbConfigured ? "(from database)" : "(static config)"}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">City</th>
                <th className="px-4 py-2">Country</th>
                <th className="px-4 py-2">Airport</th>
                <th className="px-4 py-2">Region</th>
                <th className="px-4 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {(dbConfigured ? destinations : DEFAULT_DESTINATIONS).map((d) => (
                <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2">{d.city}</td>
                  <td className="px-4 py-2">{d.country}</td>
                  <td className="px-4 py-2 font-mono">{d.airportCode}</td>
                  <td className="px-4 py-2">{d.region}</td>
                  <td className="px-4 py-2">{d.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, ok, value }: { label: string; ok: boolean; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${ok ? "text-emerald-600" : "text-red-500"}`}>
        {value ?? (ok ? "Connected" : "Not configured")}
      </p>
    </div>
  );
}
