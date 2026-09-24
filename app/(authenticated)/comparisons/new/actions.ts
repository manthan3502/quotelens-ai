"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";

const comparisonSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export async function createComparison(formData: FormData) {
  const parsed = comparisonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/comparisons/new?error=Add+a+title+under+120+characters.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/comparisons/new");

  const { data, error } = await supabase
    .from("comparisons")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/comparisons/new?error=Could+not+create+the+comparison.+Please+try+again.");
  }

  redirect(`/comparisons/${data.id}`);
}
