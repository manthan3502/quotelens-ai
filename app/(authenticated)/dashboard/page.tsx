import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type Comparison = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "extracting" | "review" | "completed";
  created_at: string;
  quotations: Array<{ count: number }>;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("comparisons")
    .select("id,title,description,status,created_at,quotations(count)")
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
        <Link className="button" href="/comparisons/new">+ New comparison</Link>
      </section>

      <section style={{ marginTop: 44 }}>
        {error ? (
          <div className="card" role="alert" style={{ padding: 22, color: "#8f2f1d" }}>We could not load your comparisons. Check the Supabase migration and try again.</div>
        ) : comparisons.length === 0 ? (
          <div className="card" style={{ padding: "54px 28px", textAlign: "center" }}>
            <div aria-hidden="true" style={{ width: 58, height: 72, margin: "0 auto 20px", border: "2px solid var(--line)", borderRadius: 9, background: "linear-gradient(135deg, white 78%, var(--soft) 78%)" }} />
            <h2 style={{ margin: 0, fontSize: 22 }}>Start with an empty comparison</h2>
            <p className="muted" style={{ maxWidth: 450, margin: "10px auto 22px", lineHeight: 1.6 }}>Name the purchase you are evaluating. Quotation uploads arrive in the next milestone.</p>
            <Link className="button" href="/comparisons/new">Create comparison</Link>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {comparisons.map((comparison, index) => (
              <Link key={comparison.id} href={`/comparisons/${comparison.id}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center", padding: "21px 24px", borderBottom: index < comparisons.length - 1 ? "1px solid var(--line)" : undefined }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comparison.title}</strong>
                  <span className="muted" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(comparison.created_at))} · {comparison.quotations[0]?.count ?? 0} quotation{(comparison.quotations[0]?.count ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="badge">{comparison.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
