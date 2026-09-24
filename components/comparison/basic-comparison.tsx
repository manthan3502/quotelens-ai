import Link from "next/link";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import { calculateQuote } from "@/src/lib/pricing/calculateQuote";

type QuoteRow = {
  id: string;
  original_filename: string;
  verified_json: unknown;
};

function formatMoney(value: number | null, currency: string | null) {
  if (value === null || !currency) return "Not available";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function BasicComparison({ comparisonId, title, quotations }: { comparisonId: string; title: string; quotations: QuoteRow[] }) {
  const rows = quotations.flatMap((row) => {
    const parsed = extractedQuotationSchema.safeParse(row.verified_json);
    return parsed.success ? [{ ...row, quote: parsed.data, calculated: calculateQuote(parsed.data) }] : [];
  });

  return (
    <div className="container" style={{ padding: "58px 0 96px" }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: 14 }}>← Dashboard</Link>
      <header className="comparison-header"><div><p className="eyebrow">Verified comparison</p><h1>{title}</h1><p className="muted">Calculated totals use the values you confirmed.</p></div><Link className="button secondary" href={`/comparisons/${comparisonId}/review`}>Edit extracted data</Link></header>
      <div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Vendor</th><th>Computed total</th><th>Source total</th><th>Calculation status</th><th>Source</th></tr></thead><tbody>{rows.map(({ id, original_filename, quote, calculated }) => <tr key={id}><td><strong>{quote.vendor.name ?? "Not found"}</strong></td><td>{formatMoney(calculated.computedGrandTotal, quote.currency)}</td><td>{formatMoney(calculated.sourceGrandTotal, quote.currency)}</td><td>{calculated.incomplete ? <span className="warning-text">Incomplete</span> : calculated.totalMismatch.detected ? <span className="warning-text">Total mismatch</span> : <span className="success-text">Complete</span>}</td><td><a href={`/api/quotations/${id}/file`} target="_blank" rel="noreferrer">{original_filename}</a></td></tr>)}</tbody></table></div>
    </div>
  );
}
