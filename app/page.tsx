import Link from "next/link";
import { Brand } from "@/components/brand";

export default function Home() {
  return (
    <main>
      <header className="container" style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Brand />
        <Link className="button secondary" href="/login">Sign in</Link>
      </header>

      <section className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 64, alignItems: "center", padding: "88px 0 96px" }}>
        <div>
          <p className="eyebrow">Quotation comparison, clarified</p>
          <h1 style={{ margin: 0, maxWidth: 680, fontSize: "clamp(2.8rem, 7vw, 5.7rem)", lineHeight: 0.96, letterSpacing: "-0.065em" }}>
            See the real cost behind every quote.
          </h1>
          <p className="muted" style={{ maxWidth: 610, margin: "28px 0 32px", fontSize: "1.14rem", lineHeight: 1.7 }}>
            Upload vendor quotations and turn inconsistent documents into one clear, reviewable comparison of pricing and commercial terms.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="button" href="/login">Try QuoteLens</Link>
            <Link className="button secondary" href="/demo">View sample comparison</Link>
          </div>
        </div>

        <div className="card" aria-label="Quotation comparison illustration" style={{ padding: 22, minHeight: 430, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
            <div><strong>Office laptops</strong><div className="muted" style={{ marginTop: 4, fontSize: 13 }}>3 vendor quotations</div></div>
            <span className="badge">Review</span>
          </div>
          {["Northstar Systems", "PixelPeak Supply", "Cedar Office Tech"].map((vendor, index) => (
            <div key={vendor} style={{ display: "grid", gridTemplateColumns: "42px 1fr auto", gap: 13, alignItems: "center", padding: "20px 0", borderBottom: index < 2 ? "1px solid var(--line)" : undefined }}>
              <span style={{ display: "grid", placeItems: "center", width: 42, height: 52, borderRadius: 7, background: index === 0 ? "var(--soft)" : "#f0f2ef", color: index === 0 ? "var(--accent)" : "var(--muted)", fontWeight: 900 }}>PDF</span>
              <div><strong style={{ fontSize: 14 }}>{vendor}</strong><div className="muted" style={{ marginTop: 5, fontSize: 12 }}>{index === 1 ? "1 field needs review" : "Ready to compare"}</div></div>
              <span style={{ color: index === 1 ? "var(--warning)" : "var(--accent)", fontWeight: 900 }}>{index === 1 ? "!" : "✓"}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, borderRadius: 12, padding: 18, background: "var(--ink)", color: "white" }}>
            <div style={{ opacity: 0.68, fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>Result</div>
            <strong style={{ display: "block", marginTop: 8, fontSize: 19 }}>One comparable view</strong>
          </div>
        </div>
      </section>

      <section id="workflow" style={{ borderTop: "1px solid var(--line)", background: "white" }}>
        <div className="container" style={{ padding: "72px 0" }}>
          <p className="eyebrow">A transparent workflow</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {["Upload quotations", "Review extracted facts", "Compare calculated costs"].map((step, index) => (
              <div key={step} style={{ borderTop: "2px solid var(--ink)", paddingTop: 18 }}>
                <span className="muted">0{index + 1}</span>
                <h2 style={{ margin: "20px 0 8px", fontSize: 20 }}>{step}</h2>
                <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{["Add PDF or image quotations from different vendors.", "Confirm every extracted value before it affects a result.", "Use deterministic totals and clear factual differences."][index]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
