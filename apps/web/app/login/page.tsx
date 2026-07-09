import { LoginClient } from "./LoginClient";

function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return url && anonKey ? { url, anonKey } : null;
}

export default function LoginPage() {
  return <LoginClient supabaseConfig={publicSupabaseConfig()} />;
}
