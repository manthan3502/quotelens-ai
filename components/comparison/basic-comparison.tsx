import Link from "next/link";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import { compareQuotes } from "@/src/lib/pricing/compareQuotes";
import { PrintButton } from "@/components/comparison/print-button";

type QuoteRow = { id: string; original_filename: string; verified_json: unknown };

function formatMoney(value: number | null, currency: string | null) {
  if (value === null || !currency) return "Not available";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function term(value: number | null | undefined, unit: string, fallback: string | null | undefined) {
  return value !== null && value !== undefined ? `${value} ${unit}` : fallback ?? "Not found";
}

export function BasicComparison({ comparisonId, title, quotations, demo = false }: { comparisonId: string; title: string; quotations: QuoteRow[]; demo?: boolean }) {
  const inputs = quotations.flatMap((row) => {
    const parsed = extractedQuotationSchema.safeParse(row.verified_json);
    return parsed.success ? [{ id: row.id, filename: row.original_filename, quote: parsed.data }] : [];
  });
  const comparison = compareQuotes(inputs);
  const lowest = comparison.quotes.filter((quote) => quote.labels.includes("Lowest comparable calculated cost"));
  const fastest = comparison.quotes.filter((quote) => quote.labels.includes("Fastest stated delivery"));
  const longest = comparison.quotes.filter((quote) => quote.labels.includes("Longest stated warranty"));
  const warnings = comparison.quotes.reduce((sum, quote) => sum + quote.warnings.length, 0);

  return (
    <div className="container comparison-page">
      <Link href={demo ? "/" : "/dashboard"} className="muted" style={{ fontSize: 14 }}>← {demo ? "Home" : "Dashboard"}</Link>
      <header className="comparison-header">
        <div><p className="eyebrow">Verified comparison</p><h1>{title}</h1><p className="muted">Calculated totals use confirmed values. Factual differences are shown without choosing a vendor.</p></div>
        <div className="comparison-actions"><PrintButton />{demo ? <Link className="button secondary" href="/login">Create your comparison</Link> : <Link className="button secondary" href={`/comparisons/${comparisonId}/review`}>Edit extracted data</Link>}</div>
      </header>

      {comparison.incompatibleCurrencies ? <div className="comparison-alert"><strong>Currencies are not fully compatible.</strong><span>Costs are compared only among complete quotations using the same currency. No exchange-rate assumptions are made.</span></div> : null}

      <section className="summary-grid" aria-label="Comparison highlights">
        <article className="summary-card"><span>Lowest comparable cost</span><strong>{lowest.length ? lowest.map((item) => item.quote.vendor.name ?? "Unnamed vendor").join(", ") : "Not available"}</strong><small>{lowest.length === 1 ? formatMoney(lowest[0].calculated.computedGrandTotal, lowest[0].quote.currency) : "Requires 2 complete quotes in one currency"}</small></article>
        <article className="summary-card"><span>Fastest stated delivery</span><strong>{fastest.length ? fastest.map((item) => item.quote.vendor.name ?? "Unnamed vendor").join(", ") : "Not found"}</strong><small>{fastest[0] ? term(fastest[0].quote.delivery.days, "days", fastest[0].quote.delivery.text) : "Review source terms"}</small></article>
        <article className="summary-card"><span>Longest stated warranty</span><strong>{longest.length ? longest.map((item) => item.quote.vendor.name ?? "Unnamed vendor").join(", ") : "Not found"}</strong><small>{longest[0] ? term(longest[0].quote.warranty.months, "months", longest[0].quote.warranty.text) : "Review source terms"}</small></article>
        <article className="summary-card"><span>Items requiring attention</span><strong>{warnings}</strong><small>{warnings ? "See factual warnings below" : "No warnings from confirmed data"}</small></article>
      </section>

      <section className="comparison-section">
        <div className="section-heading"><div><p className="eyebrow">Vendor totals</p><h2>Side-by-side comparison</h2></div><span className="muted">{comparison.quotes.length} vendors</span></div>
        <div className="comparison-table-wrap"><table className="comparison-table vendor-table"><thead><tr><th>Vendor</th><th>Computed total</th><th>Source total</th><th>Difference from lowest</th><th>Delivery</th><th>Warranty</th><th>Payment terms</th><th>Missing</th></tr></thead><tbody>{comparison.quotes.map((item) => <tr key={item.id}><td><strong>{item.quote.vendor.name ?? "Not found"}</strong><div className="table-labels">{item.labels.map((label) => <span className="badge" key={label}>{label}</span>)}</div></td><td className="money-cell">{formatMoney(item.calculated.computedGrandTotal, item.quote.currency)}{item.calculated.incomplete ? <small className="warning-text">Incomplete</small> : null}</td><td className="money-cell">{formatMoney(item.calculated.sourceGrandTotal, item.quote.currency)}{item.calculated.totalMismatch.detected ? <small className="warning-text">Difference {formatMoney(item.calculated.totalMismatch.difference, item.quote.currency)}</small> : null}</td><td>{item.differenceFromLowest === null ? "Not comparable" : item.differenceFromLowest === 0 ? "Lowest" : `+${formatMoney(item.differenceFromLowest, item.quote.currency)}`}</td><td>{term(item.quote.delivery.days, "days", item.quote.delivery.text)}</td><td>{term(item.quote.warranty.months, "months", item.quote.warranty.text)}</td><td>{item.quote.paymentTerms ?? "Not found"}</td><td>{item.missingCount}</td></tr>)}</tbody></table></div>
      </section>

      <section className="comparison-section">
        <div className="section-heading"><div><p className="eyebrow">Normalized items</p><h2>Line-item comparison</h2></div></div>
        <div className="comparison-table-wrap"><table className="comparison-table line-comparison"><thead><tr><th>Item</th>{comparison.quotes.map((quote) => <th key={quote.id}>{quote.quote.vendor.name ?? "Unnamed vendor"}</th>)}</tr></thead><tbody>{comparison.normalizedLineItems.map((item) => <tr key={item.key}><td><strong>{item.description}</strong></td>{comparison.quotes.map((quote) => { const line = item.vendors[quote.id]; return <td key={quote.id}>{line ? <><span>{line.quantity ?? "?"} {line.unit ?? "units"}</span><small>{formatMoney(line.unitPrice.amount, line.unitPrice.currency ?? quote.quote.currency)} each</small>{line.lineTotalShown?.amount !== null && line.lineTotalShown?.amount !== undefined ? <small>Source line total: {formatMoney(line.lineTotalShown.amount, line.lineTotalShown.currency ?? quote.quote.currency)}</small> : null}</> : <span className="muted">Not listed</span>}</td>; })}</tr>)}</tbody></table></div>
      </section>

      <section className="comparison-section warning-columns">
        {comparison.quotes.map((item) => <article className="vendor-warning-card" key={item.id}><div><strong>{item.quote.vendor.name ?? "Unnamed vendor"}</strong>{demo ? <span className="muted">Sample source</span> : <a href={`/api/quotations/${item.id}/file`} target="_blank" rel="noreferrer">Open source document ↗</a>}</div>{item.warnings.length ? <ul>{item.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="success-text">No factual warnings from confirmed data.</p>}{item.quote.ambiguousFields.length ? <details><summary>Ambiguous source fields</summary><ul>{item.quote.ambiguousFields.map((field) => <li key={field}>{field}</li>)}</ul></details> : null}</article>)}
      </section>
    </div>
  );
}
