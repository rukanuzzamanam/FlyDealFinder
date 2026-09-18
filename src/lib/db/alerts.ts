import "server-only";
import type { PriceAlertInput } from "../validation";
import { getSupabaseAdmin } from "./supabase";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("Database is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Finds or creates a user by email, then inserts a price alert row for
 * them. Runs as two statements rather than a single upsert because
 * `users.email` and `price_alerts` are separate concerns or an offline
 * database could be swapped in later that lacks Postgres upsert support.
 */
export async function createPriceAlert(input: PriceAlertInput): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new DatabaseNotConfiguredError();

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ email: input.email }, { onConflict: "email" })
    .select("id")
    .single();

  if (userError || !user) {
    throw new Error(userError?.message ?? "Could not create or find user");
  }

  const { data: alert, error: alertError } = await supabase
    .from("price_alerts")
    .insert({
      user_id: user.id,
      origin: input.origin,
      destination: input.destination,
      target_price: input.targetPrice,
      currency: input.currency,
      departure_date: input.departureDate ?? null,
      return_date: input.returnDate ?? null,
      active: true,
    })
    .select("id")
    .single();

  if (alertError || !alert) {
    throw new Error(alertError?.message ?? "Could not create price alert");
  }

  return { id: alert.id };
}
