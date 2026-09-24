import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div><p className="eyebrow">Not found</p><h1 style={{ margin: 0, fontSize: 48, letterSpacing: "-.05em" }}>That comparison is unavailable.</h1><p className="muted" style={{ margin: "14px 0 24px" }}>It may not exist or may belong to another account.</p><Link className="button" href="/dashboard">Return to dashboard</Link></div>
    </main>
  );
}
