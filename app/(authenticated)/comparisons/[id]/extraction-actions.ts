"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  extractQuotation,
  QuotationExtractionError,
} from "@/src/lib/ai/extractQuotation";
import type { ExtractionState } from "@/src/lib/ai/extractionState";
import { createClient } from "@/src/lib/supabase/server";

const supportedMimeTypes = ["application/pdf", "image/png", "image/jpeg"] as const;
type SupportedMimeType = (typeof supportedMimeTypes)[number];

export async function extractQuotationRecord(
  comparisonId: string,
  quotationId: string,
  previousState: ExtractionState,
): Promise<ExtractionState> {
  void previousState;
  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/comparisons/${comparisonId}`);

  const { data: quotation } = await supabase
    .from("quotations")
    .select("id,storage_path,mime_type")
    .eq("id", quotationId)
    .eq("comparison_id", comparisonId)
    .single();
  if (!quotation) return { status: "error", message: "This quotation is unavailable." };

  if (!supportedMimeTypes.includes(quotation.mime_type as SupportedMimeType)) {
    return { status: "error", message: "This quotation has an unsupported file type." };
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const startedAt = Date.now();
  const { error: statusError } = await supabase.from("quotations").update({
    extraction_status: "extracting",
    extraction_error: null,
    extraction_model: model,
    extraction_attempted_at: new Date().toISOString(),
  }).eq("id", quotationId).eq("comparison_id", comparisonId);
  if (statusError) return { status: "error", message: "We could not start reading this quotation. Please try again." };

  await supabase.from("comparisons").update({ status: "extracting" }).eq("id", comparisonId);

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from("quotations")
      .download(quotation.storage_path);
    if (downloadError || !file) throw new Error("The private quotation file could not be read.");

    const extracted = await extractQuotation({
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: quotation.mime_type as SupportedMimeType,
      model,
    });
    const duration = Date.now() - startedAt;
    const { error: saveError } = await supabase.from("quotations").update({
      extracted_json: extracted,
      vendor_name: extracted.vendor.name,
      extraction_status: "completed",
      extraction_error: null,
      extraction_duration_ms: duration,
    }).eq("id", quotationId).eq("comparison_id", comparisonId);
    if (saveError) throw new Error("Extracted data could not be saved.");

    const { data: statuses } = await supabase
      .from("quotations")
      .select("extraction_status")
      .eq("comparison_id", comparisonId);
    if (statuses && statuses.length >= 2 && statuses.every((item) => item.extraction_status === "completed")) {
      await supabase.from("comparisons").update({ status: "review" }).eq("id", comparisonId);
    }

    console.info("quotation_extraction_completed", {
      requestId,
      comparisonId,
      quotationId,
      userId: user.id,
      durationMs: duration,
      model,
    });
    revalidatePath(`/comparisons/${comparisonId}`);
    revalidatePath("/dashboard");
    return { status: "success", message: "Your quotation is ready to review." };
  } catch (error) {
    const duration = Date.now() - startedAt;
    const userMessage = error instanceof QuotationExtractionError
      ? error.userMessage
      : error instanceof Error && error.message === "The private quotation file could not be read."
        ? "The private file could not be read. Re-upload it and try again."
        : "We could not read this quotation. Please try again.";

    await supabase.from("quotations").update({
      extraction_status: "failed",
      extraction_error: userMessage,
      extraction_duration_ms: duration,
    }).eq("id", quotationId).eq("comparison_id", comparisonId);
    console.error("quotation_extraction_failed", {
      requestId,
      comparisonId,
      quotationId,
      userId: user.id,
      durationMs: duration,
      model,
      code: error instanceof QuotationExtractionError ? error.code : "unexpected",
      message: error instanceof Error ? error.message : String(error),
    });
    revalidatePath(`/comparisons/${comparisonId}`);
    return { status: "error", message: userMessage };
  }
}
