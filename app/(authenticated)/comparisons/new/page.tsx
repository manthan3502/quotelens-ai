import Link from "next/link";
import { createComparison } from "./actions";

type NewComparisonPageProps = { searchParams: Promise<{ error?: string }> };

export default async function NewComparisonPage({ searchParams }: NewComparisonPageProps) {
  const { error } = await searchParams;

  return (
    <div className="container" style={{ padding: "58px 0 96px" }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: 14 }}>← Dashboard</Link>
      <div style={{ width: "min(100%, 680px)", marginTop: 36 }}>
        <p className="eyebrow">New comparison</p>
        <h1 style={{ margin: 0, fontSize: "clamp(2.3rem, 6vw, 4rem)", lineHeight: 1, letterSpacing: "-0.055em" }}>What are you buying?</h1>
        <p className="muted" style={{ margin: "16px 0 30px", lineHeight: 1.65 }}>Give this comparison a clear name so you can find it again. Files will be added in the upload milestone.</p>
        <form action={createComparison} className="card" style={{ padding: "clamp(22px, 5vw, 34px)", display: "grid", gap: 22 }}>
          {error ? <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 9, background: "#fff0ed", color: "#8f2f1d", fontSize: 14 }}>{error}</p> : null}
          <div className="field"><label htmlFor="title">Comparison title</label><input id="title" name="title" maxLength={120} placeholder="10 Office Laptops — September 2026" required autoFocus /></div>
          <div className="field"><label htmlFor="description">Description <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label><textarea id="description" name="description" maxLength={500} placeholder="Replacement laptops for the design and operations teams" /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <Link className="button secondary" href="/dashboard">Cancel</Link>
            <button className="button" type="submit">Create comparison</button>
          </div>
        </form>
      </div>
    </div>
  );
}
