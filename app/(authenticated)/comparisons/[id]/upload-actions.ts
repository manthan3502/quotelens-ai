"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import {
  MAX_QUOTATIONS,
  MIN_QUOTATIONS,
  validateQuotationFile,
} from "@/src/lib/files/quotationFiles";
import type { UploadState } from "@/src/lib/files/uploadState";

export async function uploadQuotations(
  comparisonId: string,
  _previousState: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/comparisons/${comparisonId}`);

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id")
    .eq("id", comparisonId)
    .single();
  if (!comparison) return { status: "error", message: "This comparison is unavailable." };

  const { count, error: countError } = await supabase
    .from("quotations")
    .select("id", { count: "exact", head: true })
    .eq("comparison_id", comparisonId);
  if (countError) return { status: "error", message: "Could not check the existing quotations. Try again." };

  const existingCount = count ?? 0;
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const minimumBatchSize = existingCount === 0 ? MIN_QUOTATIONS : 1;
  const remainingSlots = MAX_QUOTATIONS - existingCount;

  if (files.length < minimumBatchSize) {
    return {
      status: "error",
      message: existingCount === 0 ? "Select at least 2 quotation files." : "Select a quotation file to add.",
    };
  }
  if (files.length > remainingSlots) {
    return { status: "error", message: `You can add ${remainingSlots} more quotation${remainingSlots === 1 ? "" : "s"}.` };
  }

  let validatedFiles;
  try {
    validatedFiles = await Promise.all(files.map(validateQuotationFile));
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "One of the files is invalid." };
  }

  const uploadedPaths: string[] = [];
  const removeUploadedFiles = async () => {
    if (uploadedPaths.length > 0) await supabase.storage.from("quotations").remove(uploadedPaths);
  };

  for (const validated of validatedFiles) {
    const storagePath = `${user.id}/${comparisonId}/${crypto.randomUUID()}.${validated.extension}`;
    const { error } = await supabase.storage.from("quotations").upload(storagePath, validated.file, {
      contentType: validated.mimeType,
      upsert: false,
    });

    if (error) {
      await removeUploadedFiles();
      console.error("quotation_upload_failed", { comparisonId, userId: user.id, stage: "storage", message: error.message });
      return { status: "error", message: `Could not upload ${validated.safeOriginalFilename}. Please try again.` };
    }
    uploadedPaths.push(storagePath);
  }

  const records = validatedFiles.map((validated, index) => ({
    comparison_id: comparisonId,
    original_filename: validated.safeOriginalFilename,
    storage_path: uploadedPaths[index],
    mime_type: validated.mimeType,
    file_size: validated.file.size,
    extraction_status: "pending",
  }));
  const { error: insertError } = await supabase.from("quotations").insert(records);

  if (insertError) {
    await removeUploadedFiles();
    console.error("quotation_upload_failed", { comparisonId, userId: user.id, stage: "database", message: insertError.message });
    return { status: "error", message: "The files were not saved. Please try again." };
  }

  revalidatePath(`/comparisons/${comparisonId}`);
  revalidatePath("/dashboard");
  redirect(`/comparisons/${comparisonId}?uploaded=${files.length}`);
}

export async function deleteQuotation(
  comparisonId: string,
  quotationId: string,
  previousState: UploadState,
): Promise<UploadState> {
  void previousState;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/comparisons/${comparisonId}`);

  const { data: quotation } = await supabase
    .from("quotations")
    .select("id,storage_path")
    .eq("id", quotationId)
    .eq("comparison_id", comparisonId)
    .single();
  if (!quotation) return { status: "error", message: "This quotation is unavailable." };

  const { error: storageError } = await supabase.storage.from("quotations").remove([quotation.storage_path]);
  if (storageError) {
    console.error("quotation_delete_failed", { comparisonId, quotationId, userId: user.id, stage: "storage", message: storageError.message });
    return { status: "error", message: "Could not remove the private file. Please try again." };
  }

  const { error: recordError } = await supabase
    .from("quotations")
    .delete()
    .eq("id", quotationId)
    .eq("comparison_id", comparisonId);
  if (recordError) {
    console.error("quotation_delete_failed", { comparisonId, quotationId, userId: user.id, stage: "database", message: recordError.message });
    return { status: "error", message: "The file was removed, but its record could not be deleted. Refresh and try again." };
  }

  revalidatePath(`/comparisons/${comparisonId}`);
  revalidatePath("/dashboard");
  redirect(`/comparisons/${comparisonId}?deleted=1`);
}
