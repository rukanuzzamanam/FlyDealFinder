import "server-only";
import { DatabaseNotConfiguredError } from "./alerts";
import { getSupabaseAdmin } from "./supabase";
import type { NewsletterSignupInput } from "../validation";

export { DatabaseNotConfiguredError };

/**
 * Upserts a newsletter subscriber by email (re-subscribing and updating
 * preferences if they'd previously unsubscribed). Mirrors the "optional DB"
 * pattern used throughout src/lib/db — throws DatabaseNotConfiguredError
 * when Supabase isn't set up, which the API route turns into a 503.
 */
export async function subscribeToNewsletter(
  input: NewsletterSignupInput
): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new DatabaseNotConfiguredError();

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      {
        email: input.email,
        preferences: input.preferences,
        subscribed: true,
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save newsletter subscription");
  }

  return { id: data.id };
}
