import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export function createSupabaseServerClient(context) {
  if (!context?.req || !context?.res) {
    console.warn("⚠️ Missing req/res context — falling back to client-only mode");
    return null;
  }

  return createPagesServerClient(context, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
