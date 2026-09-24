"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/src/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
