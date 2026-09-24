"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { safeRedirectPath } from "@/src/lib/navigation/safeRedirect";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

function messageUrl(kind: "error" | "message", message: string, next: string) {
  const params = new URLSearchParams({ [kind]: message, next });
  return `/login?${params.toString()}`;
}

export async function signIn(formData: FormData) {
  const next = safeRedirectPath(formData.get("next")?.toString() ?? null);
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("error", "Enter a valid email and a password of at least 8 characters.", next));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(messageUrl("error", error.message, next));
  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = safeRedirectPath(formData.get("next")?.toString() ?? null);
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(messageUrl("error", "Enter a valid email and a password of at least 8 characters.", next));

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) redirect(messageUrl("error", error.message, next));
  if (data.session) redirect(next);
  redirect(messageUrl("message", "Check your email to confirm your account, then sign in.", next));
}
