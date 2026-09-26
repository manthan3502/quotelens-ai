"use server";

import { reviewFieldLabel } from "@/src/lib/review/displayText";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import type { ReviewState } from "@/src/lib/review/reviewState";
import { createClient } from "@/src/lib/supabase/server";

export async function verifyQuotation(
  comparisonId: string,
  quotationId: string,
  previousState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  void previousState;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/comparisons/${comparisonId}/review`);

  const raw = formData.get("verifiedJson");
  if (typeof raw !== "string") return { status: "error", message: "Review data is missing." };

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Review data could not be read. Refresh and try again." };
  }
  const parsed = extractedQuotationSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: `Please check ${reviewFieldLabel(first.path.join(".")) || "the form"}. Use valid text or a non-negative number; percentages must be between 0 and 100.` };
  }

  const { error } = await supabase.from("quotations").update({
    verified_json: parsed.data,
    verified_at: new Date().toISOString(),
    vendor_name: parsed.data.vendor.name,
  }).eq("id", quotationId).eq("comparison_id", comparisonId);
  if (error) return { status: "error", message: "We could not save your changes. Please try again." };

  const { data: quotations } = await supabase
    .from("quotations")
    .select("verified_json")
    .eq("comparison_id", comparisonId);
  const allVerified = quotations && quotations.length >= 2 && quotations.every((quotation) => quotation.verified_json !== null);
  if (allVerified) {
    await supabase.from("comparisons").update({ status: "completed" }).eq("id", comparisonId);
    revalidatePath(`/comparisons/${comparisonId}`);
    revalidatePath("/dashboard");
    redirect(`/comparisons/${comparisonId}`);
  }

  revalidatePath(`/comparisons/${comparisonId}/review`);
  return { status: "success", message: "Quotation confirmed. Check the remaining quotations to see your comparison." };
}
