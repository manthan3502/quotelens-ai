import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

type ComparisonPageProps = { params: Promise<{ id: string }> };
type Comparison = { id: string; title: string; description: string | null; status: string; created_at: string };

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comparisons")
    .select("id,title,description,status,created_at")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const comparison = data as Comparison;

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

      <section className="card" style={{ marginTop: 42, padding: "clamp(28px, 7vw, 70px)", textAlign: "center", borderStyle: "dashed" }}>
        <div aria-hidden="true" style={{ width: 74, height: 58, margin: "0 auto 22px", borderRadius: 12, background: "var(--soft)", display: "grid", placeItems: "center", color: "var(--accent)", fontSize: 28, fontWeight: 900 }}>+</div>
        <h2 style={{ margin: 0, fontSize: 24 }}>Your comparison is ready</h2>
        <p className="muted" style={{ maxWidth: 500, margin: "12px auto 0", lineHeight: 1.65 }}>This empty workspace is saved and can be reopened from your dashboard. Secure quotation uploads are the next milestone.</p>
      </section>
    </div>
  );
}
