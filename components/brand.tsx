import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="QuoteLens home" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 10, background: "var(--ink)", color: "white", fontWeight: 900 }}>Q</span>
      <span style={{ fontWeight: 850, letterSpacing: "-0.03em", fontSize: "1.08rem" }}>QuoteLens AI</span>
    </Link>
  );
}
