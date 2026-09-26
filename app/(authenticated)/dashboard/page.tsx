import { displayText } from "@/src/lib/review/displayText";
import Link from "next/link";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import { compareQuotes } from "@/src/lib/pricing/compareQuotes";
import { createClient } from "@/src/lib/supabase/server";

type Comparison = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "extracting" | "review" | "completed";
  created_at: string;
  quotations: Array<{ id: string; original_filename: string; vendor_name: string | null; verified_json: unknown }>;
};

function formatMoney(value: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("comparisons")
    .select("id,title,description,status,created_at,quotations(id,original_filename,vendor_name,verified_json)")
    .order("created_at", { ascending: false })
    .limit(12);
  const comparisons = (data ?? []) as Comparison[];

  return (
    <div className="container" style={{ padding: "64px 0 96px" }}>
      <section style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 6vw, 4.2rem)", lineHeight: 1, letterSpacing: "-0.055em" }}>Your comparisons</h1>
          <p className="muted" style={{ margin: "14px 0 0" }}>Signed in as {user?.email}</p>
        </div>
        <Link className="button" href="/comparisons/new">+ Start a Comparison</Link>
      </section>

      <section style={{ marginTop: 44 }}>
        {error ? (
          <div className="card" role="alert" style={{ padding: 22, color: "#8f2f1d" }}>We could not load your comparisons. Refresh the page and try again.</div>
        ) : comparisons.length === 0 ? (
          <div className="card" style={{ padding: "54px 28px", textAlign: "center" }}>
            <div aria-hidden="true" style={{ width: 58, height: 72, margin: "0 auto 20px", border: "2px solid var(--line)", borderRadius: 9, background: "linear-gradient(135deg, white 78%, var(--soft) 78%)" }} />
            <h2 style={{ margin: 0, fontSize: 22 }}>Compare your first quotations</h2>
            <p className="muted" style={{ maxWidth: 450, margin: "10px auto 22px", lineHeight: 1.6 }}>Upload quotations from different vendors and see their prices, taxes, delivery, warranty and payment terms side by side.</p>
            <Link className="button" href="/comparisons/new">+ Start a Comparison</Link>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {comparisons.map((comparison, index) => {
              const inputs = comparison.quotations.flatMap((quotation) => {
                const parsed = extractedQuotationSchema.safeParse(quotation.verified_json);
                return parsed.success ? [{ id: quotation.id, filename: quotation.original_filename, quote: parsed.data }] : [];
              });
              const compared = compareQuotes(inputs);
              const lowest = compared.quotes.find((quote) => quote.labels.includes("Lowest comparable calculated cost"));
              const vendorCount = new Set(comparison.quotations.map((quotation) => quotation.vendor_name).filter(Boolean)).size;
              return <Link key={comparison.id} href={`/comparisons/${comparison.id}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center", padding: "21px 24px", borderBottom: index < comparisons.length - 1 ? "1px solid var(--line)" : undefined }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comparison.title}</strong>
                  <span className="muted" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(comparison.created_at))} · {comparison.quotations.length} quotation{comparison.quotations.length === 1 ? "" : "s"} · {vendorCount} vendor{vendorCount === 1 ? "" : "s"}{lowest?.calculated.computedGrandTotal !== null && lowest?.calculated.computedGrandTotal !== undefined && lowest.quote.currency ? ` · Lowest ${formatMoney(lowest.calculated.computedGrandTotal, lowest.quote.currency)}` : ""}
                  </span>
                </div>
                <span className="badge">{displayText(comparison.status)}</span>
              </Link>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
