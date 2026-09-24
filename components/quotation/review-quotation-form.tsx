"use client";

import { useActionState, useId, useState } from "react";
import type { ExtractedQuotation, Money, QuoteLineItem } from "@/src/lib/ai/schema";
import { calculateQuote } from "@/src/lib/pricing/calculateQuote";
import { initialReviewState, type ReviewState } from "@/src/lib/review/reviewState";

type ReviewAction = (state: ReviewState, formData: FormData) => Promise<ReviewState>;

function numberValue(value: number | null | undefined) {
  return value ?? "";
}

function parseNumber(value: string) {
  return value === "" ? null : Number(value);
}

function blankMoney(currency: string | null): Money {
  return { amount: null, currency, rawText: null };
}

function normalizeQuotation(quote: ExtractedQuotation): ExtractedQuotation {
  const currency = quote.currency;
  return {
    ...quote,
    vendor: {
      name: quote.vendor.name,
      phone: quote.vendor.phone ?? null,
      email: quote.vendor.email ?? null,
      address: quote.vendor.address ?? null,
      taxId: quote.vendor.taxId ?? null,
    },
    quotationNumber: quote.quotationNumber ?? null,
    quotationDate: quote.quotationDate ?? null,
    validUntil: quote.validUntil ?? null,
    lineItems: quote.lineItems.map((item) => ({
      ...item,
      brand: item.brand ?? null,
      model: item.model ?? null,
      specification: item.specification ?? null,
      unit: item.unit ?? null,
      discountPercent: item.discountPercent ?? null,
      discountAmount: item.discountAmount ?? blankMoney(currency),
      taxPercent: item.taxPercent ?? null,
      lineTotalShown: item.lineTotalShown ?? blankMoney(currency),
      confidence: item.confidence ?? null,
    })),
    subtotalShown: quote.subtotalShown ?? blankMoney(currency),
    discountShown: quote.discountShown ?? blankMoney(currency),
    tax: {
      type: quote.tax.type ?? null,
      percent: quote.tax.percent ?? null,
      amountShown: quote.tax.amountShown ?? blankMoney(currency),
      includedInPrice: quote.tax.includedInPrice ?? null,
      rawText: quote.tax.rawText ?? null,
    },
    shipping: quote.shipping ?? blankMoney(currency),
    installation: quote.installation ?? blankMoney(currency),
    otherCharges: quote.otherCharges ?? [],
    grandTotalShown: quote.grandTotalShown ?? blankMoney(currency),
    delivery: { days: quote.delivery.days ?? null, text: quote.delivery.text ?? null },
    warranty: { months: quote.warranty.months ?? null, text: quote.warranty.text ?? null },
    paymentTerms: quote.paymentTerms ?? null,
    notes: quote.notes ?? [],
  };
}

function changeCurrency(quote: ExtractedQuotation, currency: string | null): ExtractedQuotation {
  const updateMoney = (money: Money | undefined) => money ? { ...money, currency } : money;
  return {
    ...quote,
    currency,
    lineItems: quote.lineItems.map((item) => ({
      ...item,
      unitPrice: { ...item.unitPrice, currency },
      discountAmount: updateMoney(item.discountAmount),
      lineTotalShown: updateMoney(item.lineTotalShown),
    })),
    subtotalShown: updateMoney(quote.subtotalShown),
    discountShown: updateMoney(quote.discountShown),
    tax: { ...quote.tax, amountShown: updateMoney(quote.tax.amountShown) },
    shipping: updateMoney(quote.shipping),
    installation: updateMoney(quote.installation),
    otherCharges: quote.otherCharges?.map((charge) => ({ ...charge, amount: { ...charge.amount, currency } })),
    grandTotalShown: updateMoney(quote.grandTotalShown),
  };
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string | null | undefined; onChange: (value: string | null) => void; placeholder?: string }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value || null)} /></div>;
}

function NumberInput({ label, value, onChange, step = "0.01" }: { label: string; value: number | null | undefined; onChange: (value: number | null) => void; step?: string }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} type="number" min="0" step={step} value={numberValue(value)} onChange={(event) => onChange(parseNumber(event.target.value))} /></div>;
}

function MoneyInput({ label, value, currency, onChange }: { label: string; value: Money; currency: string | null; onChange: (value: Money) => void }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="money-input"><input id={id} type="number" min="0" step="0.01" value={numberValue(value.amount)} onChange={(event) => onChange({ ...value, amount: parseNumber(event.target.value), currency })} /><span aria-hidden="true">{currency ?? "—"}</span></div>
      {value.rawText ? <small className="muted">Source: {value.rawText}</small> : null}
    </div>
  );
}

function TextareaInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function calculationFieldLabel(path: string) {
  const lineField = /^lineItems\.(\d+)\.(.+)$/.exec(path);
  if (lineField) {
    const field = lineField[2] === "quantity" ? "quantity"
      : lineField[2] === "unitPrice" ? "unit price"
        : lineField[2] === "unitPrice.currency" ? "unit price currency"
          : lineField[2];
    return `Item ${Number(lineField[1]) + 1} ${field}`;
  }
  const labels: Record<string, string> = {
    currency: "Quotation currency",
    tax: "Tax rate or amount",
    "lineItems.taxPercent": "Tax rate for every line item, or a quotation-level tax rate or amount",
    shipping: "Shipping amount",
    installation: "Installation amount",
  };
  return labels[path] ?? path;
}

export function ReviewQuotationForm({ initial, action, filename, verified }: { initial: ExtractedQuotation; action: ReviewAction; filename: string; verified: boolean }) {
  const taxIncludedId = useId();
  const [quote, setQuote] = useState(() => normalizeQuotation(initial));
  const [state, formAction, pending] = useActionState(action, initialReviewState);
  const calculation = calculateQuote(quote);
  const updateLine = (index: number, update: (item: QuoteLineItem) => QuoteLineItem) => setQuote((current) => ({ ...current, lineItems: current.lineItems.map((item, itemIndex) => itemIndex === index ? update(item) : item) }));

  return (
    <form action={formAction} className="review-form" aria-busy={pending}>
      <input type="hidden" name="verifiedJson" value={JSON.stringify(quote)} />
      <div className="review-form-heading"><div><span className="muted">{filename}</span><h2>{quote.vendor.name ?? "Unnamed vendor"}</h2></div><span className="badge">{verified ? "Verified" : "Needs confirmation"}</span></div>

      <fieldset><legend>Vendor and quotation</legend><div className="form-grid">
        <TextInput label="Vendor name" value={quote.vendor.name} onChange={(name) => setQuote({ ...quote, vendor: { ...quote.vendor, name } })} />
        <TextInput label="Tax ID" value={quote.vendor.taxId} onChange={(taxId) => setQuote({ ...quote, vendor: { ...quote.vendor, taxId } })} />
        <TextInput label="Email" value={quote.vendor.email} onChange={(email) => setQuote({ ...quote, vendor: { ...quote.vendor, email } })} />
        <TextInput label="Phone" value={quote.vendor.phone} onChange={(phone) => setQuote({ ...quote, vendor: { ...quote.vendor, phone } })} />
        <TextInput label="Address" value={quote.vendor.address} onChange={(address) => setQuote({ ...quote, vendor: { ...quote.vendor, address } })} />
        <TextInput label="Quotation number" value={quote.quotationNumber} onChange={(quotationNumber) => setQuote({ ...quote, quotationNumber })} />
        <TextInput label="Quotation date" value={quote.quotationDate} onChange={(quotationDate) => setQuote({ ...quote, quotationDate })} />
        <TextInput label="Valid until" value={quote.validUntil} onChange={(validUntil) => setQuote({ ...quote, validUntil })} />
        <TextInput label="Currency" value={quote.currency} placeholder="INR" onChange={(currency) => setQuote(changeCurrency(quote, currency?.toUpperCase() ?? null))} />
      </div></fieldset>

      <fieldset><legend>Line items</legend><div className="review-line-items">
        {quote.lineItems.map((item, index) => <div className="review-line-item" key={index}>
          <div className="line-item-heading"><strong>Item {index + 1}</strong>{quote.lineItems.length > 1 ? <button type="button" className="text-button danger-text" onClick={() => setQuote({ ...quote, lineItems: quote.lineItems.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button> : null}</div>
          <div className="form-grid">
            <TextInput label="Description" value={item.description} onChange={(description) => updateLine(index, (current) => ({ ...current, description: description ?? "" }))} />
            <TextInput label="Brand" value={item.brand} onChange={(brand) => updateLine(index, (current) => ({ ...current, brand }))} />
            <TextInput label="Model" value={item.model} onChange={(model) => updateLine(index, (current) => ({ ...current, model }))} />
            <TextInput label="Specification" value={item.specification} onChange={(specification) => updateLine(index, (current) => ({ ...current, specification }))} />
            <NumberInput label="Quantity" value={item.quantity} onChange={(quantity) => updateLine(index, (current) => ({ ...current, quantity }))} />
            <TextInput label="Unit" value={item.unit} onChange={(unit) => updateLine(index, (current) => ({ ...current, unit }))} />
            <MoneyInput label="Unit price" value={item.unitPrice} currency={quote.currency} onChange={(unitPrice) => updateLine(index, (current) => ({ ...current, unitPrice }))} />
            <NumberInput label="Discount %" value={item.discountPercent} onChange={(discountPercent) => updateLine(index, (current) => ({ ...current, discountPercent }))} />
            <MoneyInput label="Discount amount" value={item.discountAmount ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(discountAmount) => updateLine(index, (current) => ({ ...current, discountAmount }))} />
            <NumberInput label="Tax %" value={item.taxPercent} onChange={(taxPercent) => updateLine(index, (current) => ({ ...current, taxPercent }))} />
            <MoneyInput label="Line total shown" value={item.lineTotalShown ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(lineTotalShown) => updateLine(index, (current) => ({ ...current, lineTotalShown }))} />
          </div>
        </div>)}
        <button type="button" className="button secondary" onClick={() => setQuote({ ...quote, lineItems: [...quote.lineItems, { description: "", quantity: null, unitPrice: blankMoney(quote.currency) }] })}>+ Add line item</button>
      </div></fieldset>

      <fieldset><legend>Totals and charges</legend><div className="form-grid">
        <MoneyInput label="Subtotal shown" value={quote.subtotalShown ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(subtotalShown) => setQuote({ ...quote, subtotalShown })} />
        <MoneyInput label="Discount shown" value={quote.discountShown ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(discountShown) => setQuote({ ...quote, discountShown })} />
        <TextInput label="Tax type" value={quote.tax.type} onChange={(type) => setQuote({ ...quote, tax: { ...quote.tax, type } })} />
        <NumberInput label="Tax %" value={quote.tax.percent} onChange={(percent) => setQuote({ ...quote, tax: { ...quote.tax, percent } })} />
        <MoneyInput label="Tax amount shown" value={quote.tax.amountShown ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(amountShown) => setQuote({ ...quote, tax: { ...quote.tax, amountShown } })} />
        <div className="field"><label htmlFor={taxIncludedId}>Tax included in price</label><select id={taxIncludedId} value={quote.tax.includedInPrice === null || quote.tax.includedInPrice === undefined ? "unknown" : String(quote.tax.includedInPrice)} onChange={(event) => setQuote({ ...quote, tax: { ...quote.tax, includedInPrice: event.target.value === "unknown" ? null : event.target.value === "true" } })}><option value="unknown">Not found</option><option value="false">No</option><option value="true">Yes</option></select></div>
        <MoneyInput label="Shipping" value={quote.shipping ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(shipping) => setQuote({ ...quote, shipping })} />
        <MoneyInput label="Installation" value={quote.installation ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(installation) => setQuote({ ...quote, installation })} />
        <MoneyInput label="Grand total shown" value={quote.grandTotalShown ?? blankMoney(quote.currency)} currency={quote.currency} onChange={(grandTotalShown) => setQuote({ ...quote, grandTotalShown })} />
      </div>
      <div className="review-line-items">{quote.otherCharges?.map((charge, index) => <div className="other-charge" key={index}><TextInput label="Other charge" value={charge.label} onChange={(label) => setQuote({ ...quote, otherCharges: quote.otherCharges?.map((current, chargeIndex) => chargeIndex === index ? { ...current, label: label ?? "" } : current) })} /><MoneyInput label="Amount" value={charge.amount} currency={quote.currency} onChange={(amount) => setQuote({ ...quote, otherCharges: quote.otherCharges?.map((current, chargeIndex) => chargeIndex === index ? { ...current, amount } : current) })} /><button type="button" className="text-button danger-text" onClick={() => setQuote({ ...quote, otherCharges: quote.otherCharges?.filter((_, chargeIndex) => chargeIndex !== index) })}>Remove</button></div>)}<button type="button" className="text-button" onClick={() => setQuote({ ...quote, otherCharges: [...(quote.otherCharges ?? []), { label: "", amount: blankMoney(quote.currency) }] })}>+ Add other charge</button></div>
      </fieldset>

      <fieldset><legend>Commercial terms</legend><div className="form-grid">
        <NumberInput label="Delivery days" value={quote.delivery.days} step="1" onChange={(days) => setQuote({ ...quote, delivery: { ...quote.delivery, days } })} />
        <TextInput label="Delivery wording" value={quote.delivery.text} onChange={(text) => setQuote({ ...quote, delivery: { ...quote.delivery, text } })} />
        <NumberInput label="Warranty months" value={quote.warranty.months} step="1" onChange={(months) => setQuote({ ...quote, warranty: { ...quote.warranty, months } })} />
        <TextInput label="Warranty wording" value={quote.warranty.text} onChange={(text) => setQuote({ ...quote, warranty: { ...quote.warranty, text } })} />
        <TextInput label="Payment terms" value={quote.paymentTerms} onChange={(paymentTerms) => setQuote({ ...quote, paymentTerms })} />
      </div>
      <TextareaInput label="Source notes, one per line" value={(quote.notes ?? []).join("\n")} onChange={(value) => setQuote({ ...quote, notes: value.split("\n").map((note) => note.trim()).filter(Boolean) })} />
      </fieldset>

      <fieldset><legend>Extraction review</legend><div className="form-grid">
        <TextareaInput label="Missing fields, one per line" value={quote.missingFields.join("\n")} onChange={(value) => setQuote({ ...quote, missingFields: value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
        <TextareaInput label="Ambiguous fields, one per line" value={quote.ambiguousFields.join("\n")} onChange={(value) => setQuote({ ...quote, ambiguousFields: value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
      </div>{quote.extractionWarnings.length ? <div className="warning-list"><strong>Extraction warnings</strong><ul>{quote.extractionWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}</fieldset>

      {calculation.incomplete ? <div className="form-error" role="alert"><strong>Required before totals can be calculated:</strong><ul>{calculation.missingForCalculation.map((path) => <li key={path}>{calculationFieldLabel(path)}</li>)}</ul></div> : null}
      {state.message ? <p className={state.status === "error" ? "form-error" : "success-message"} role="status">{state.message}</p> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? "Saving verified data…" : verified ? "Save verified changes" : "Confirm verified data"}</button>
    </form>
  );
}
