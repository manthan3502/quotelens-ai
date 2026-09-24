import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewQuotationForm } from "@/components/quotation/review-quotation-form";
import { extractedQuotationSchema, type ExtractedQuotation } from "@/src/lib/ai/schema";
import { createClient } from "@/src/lib/supabase/server";
import { verifyQuotation } from "./actions";

type ReviewPageProps = { params: Promise<{ id: string }> };
type ReviewRow = {
  id: string;
  original_filename: string;
  extraction_status: string;
  extracted_json: unknown;
  verified_json: unknown;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: comparison }, { data: quotationData }] = await Promise.all([
    supabase.from("comparisons").select("id,title").eq("id", id).single(),
    supabase.from("quotations").select("id,original_filename,extraction_status,extracted_json,verified_json").eq("comparison_id", id).order("created_at"),
  ]);
  if (!comparison) notFound();
  const rows = (quotationData ?? []) as ReviewRow[];
  if (rows.length < 2 || rows.some((row) => row.extraction_status !== "completed" || !row.extracted_json)) {
    redirect(`/comparisons/${id}`);
  }

  const quotations = rows.map((row) => {
    const parsed = extractedQuotationSchema.safeParse(row.verified_json ?? row.extracted_json);
    return { ...row, parsed };
  });

  return (
    <div className="container review-page">
      <Link href={`/comparisons/${id}`} className="muted" style={{ fontSize: 14 }}>← Comparison workspace</Link>
      <header className="review-page-header">
        <div><p className="eyebrow">Human verification</p><h1>Review {comparison.title}</h1><p className="muted">Correct every extracted value before confirming it. Calculations only use verified data.</p></div>
        <span className="badge">{rows.filter((row) => row.verified_json).length}/{rows.length} verified</span>
      </header>

      <nav className="review-jump" aria-label="Quotation review navigation">
        {quotations.map((quotation, index) => <a href={`#quotation-${quotation.id}`} key={quotation.id}>{index + 1}. {quotation.parsed.success ? quotation.parsed.data.vendor.name ?? quotation.original_filename : quotation.original_filename}</a>)}
      </nav>

      <div className="review-stack">
        {quotations.map((quotation) => (
          <section id={`quotation-${quotation.id}`} key={quotation.id}>
            {quotation.parsed.success ? (
              <ReviewQuotationForm
                initial={quotation.parsed.data as ExtractedQuotation}
                filename={quotation.original_filename}
                verified={Boolean(quotation.verified_json)}
                action={verifyQuotation.bind(null, id, quotation.id)}
              />
            ) : (
              <div className="form-error">Stored extraction data is invalid. Return to the workspace and retry extraction.</div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
