import Link from "next/link";
import { notFound } from "next/navigation";
import { UploadForm } from "@/components/quotation/upload-form";
import { DeleteQuotationButton } from "@/components/quotation/delete-quotation-button";
import { ExtractionButton } from "@/components/quotation/extraction-button";
import { BasicComparison } from "@/components/comparison/basic-comparison";
import { formatFileSize, MAX_QUOTATIONS } from "@/src/lib/files/quotationFiles";
import { createClient } from "@/src/lib/supabase/server";
import { deleteQuotation, uploadQuotations } from "./upload-actions";
import { extractQuotationRecord } from "./extraction-actions";

type ComparisonPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ uploaded?: string; deleted?: string }>;
};
type Comparison = { id: string; title: string; description: string | null; status: string; created_at: string };
type Quotation = {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  extraction_status: "pending" | "extracting" | "completed" | "failed";
  extraction_error: string | null;
  vendor_name: string | null;
  verified_json: unknown;
};

export default async function ComparisonPage({ params, searchParams }: ComparisonPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data, error }, { data: quotationData, error: quotationError }] = await Promise.all([
    supabase.from("comparisons").select("id,title,description,status,created_at").eq("id", id).single(),
    supabase.from("quotations").select("id,original_filename,mime_type,file_size,created_at,extraction_status,extraction_error,vendor_name,verified_json").eq("comparison_id", id).order("created_at", { ascending: true }),
  ]);

  if (error || !data) notFound();
  const comparison = data as Comparison;
  const quotations = (quotationData ?? []) as Quotation[];
  const uploadAction = uploadQuotations.bind(null, id);
  const uploadedCount = Number.parseInt(query.uploaded ?? "0", 10);

  if (comparison.status === "completed" && quotations.length >= 2 && quotations.every((quotation) => quotation.verified_json)) {
    return <BasicComparison comparisonId={id} title={comparison.title} quotations={quotations} />;
  }

  return (
    <div className="container" style={{ padding: "58px 0 96px" }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: 14 }}>← Dashboard</Link>
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, flexWrap: "wrap", marginTop: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span className="badge">{comparison.status}</span><span className="muted" style={{ fontSize: 13 }}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(comparison.created_at))}</span></div>
          <h1 style={{ margin: 0, maxWidth: 780, fontSize: "clamp(2.2rem, 6vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.055em" }}>{comparison.title}</h1>
          {comparison.description ? <p className="muted" style={{ maxWidth: 680, margin: "14px 0 0", lineHeight: 1.6 }}>{comparison.description}</p> : null}
        </div>
      </section>

      {uploadedCount > 0 ? <p className="success-message" role="status">{uploadedCount} quotation{uploadedCount === 1 ? "" : "s"} uploaded securely.</p> : null}
      {query.deleted === "1" ? <p className="success-message" role="status">Quotation deleted.</p> : null}
      {quotationError ? <p className="form-error" role="alert" style={{ marginTop: 32 }}>Could not load the quotation files. Refresh and try again.</p> : null}

      <section style={{ marginTop: 42 }}>
        <div className="section-heading">
          <div><p className="eyebrow">Source documents</p><h2 style={{ margin: 0, fontSize: 26 }}>Quotations <span className="muted">{quotations.length}/{MAX_QUOTATIONS}</span></h2></div>
          <span className="privacy-note">Private storage</span>
        </div>

        {quotations.length > 0 ? (
          <div className="quotation-list">
            {quotations.map((quotation) => (
              <article className="quotation-card" key={quotation.id}>
                <span className="file-mark" aria-hidden="true">{quotation.mime_type === "application/pdf" ? "PDF" : "IMG"}</span>
                <div className="quotation-details">
                  <strong>{quotation.original_filename}</strong>
                  <span className="muted">{formatFileSize(quotation.file_size)} · {quotation.vendor_name ?? "Stored securely"}</span>
                  {quotation.extraction_error ? <span className="status-error">{quotation.extraction_error}</span> : null}
                </div>
                <div className="file-actions">
                  {quotation.extraction_status !== "completed" ? <ExtractionButton action={extractQuotationRecord.bind(null, id, quotation.id)} retry={quotation.extraction_status === "failed"} /> : <span className="badge">Extracted</span>}
                  <a className="button secondary compact" href={`/api/quotations/${quotation.id}/file`} target="_blank" rel="noreferrer">Preview</a>
                  <a className="button ghost compact" href={`/api/quotations/${quotation.id}/file?download=1`}>Download</a>
                  <DeleteQuotationButton action={deleteQuotation.bind(null, id, quotation.id)} filename={quotation.original_filename} />
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {quotations.length < MAX_QUOTATIONS ? (
          <div style={{ marginTop: quotations.length > 0 ? 22 : 0 }}><UploadForm action={uploadAction} existingCount={quotations.length} /></div>
        ) : (
          <div className="limit-message"><strong>Five quotations added.</strong><span className="muted">This comparison has reached the v1 limit.</span></div>
        )}
      </section>

      {quotations.length >= 2 ? (
        <section className="next-step-card">
          <div><p className="eyebrow">Extraction</p><h2 style={{ margin: 0, fontSize: 22 }}>{quotations.every((quotation) => quotation.extraction_status === "completed") ? "All quotations are ready for review" : "Extract each source document"}</h2><p className="muted" style={{ margin: "8px 0 0", lineHeight: 1.6 }}>Gemini extracts factual fields into a schema. You will verify every value before calculations.</p></div>
          {quotations.every((quotation) => quotation.extraction_status === "completed") ? <Link className="button" href={`/comparisons/${id}/review`}>Review extracted data</Link> : <span className="badge">{quotations.filter((quotation) => quotation.extraction_status === "completed").length}/{quotations.length} extracted</span>}
        </section>
      ) : null}
    </div>
  );
}
