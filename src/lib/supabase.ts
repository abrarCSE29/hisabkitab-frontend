import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null when Supabase isn't configured — the app then falls back to
// dev-token login so the backend can still be exercised locally.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const RECEIPTS_BUCKET =
  process.env.NEXT_PUBLIC_RECEIPTS_BUCKET ?? "hisabkitab-voucher";
