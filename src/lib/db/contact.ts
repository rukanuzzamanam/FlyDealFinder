import "server-only";
import { DatabaseNotConfiguredError } from "./alerts";
import { getSupabaseAdmin } from "./supabase";
import type { ContactInput } from "../validation";

export { DatabaseNotConfiguredError };

/** Persists a contact form submission. See docs on why this isn't emailed
 * directly: no email-sending provider is configured yet (brief section 35) —
 * submissions are stored for an operator to review, never faked as "sent". */
export async function saveContactMessage(
  input: Pick<ContactInput, "name" | "email" | "message">
): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new DatabaseNotConfiguredError();

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({ name: input.name, email: input.email, message: input.message })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save contact message");
  }

  return { id: data.id };
}
