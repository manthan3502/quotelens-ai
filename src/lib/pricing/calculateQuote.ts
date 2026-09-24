import type { ExtractedQuotation, Money, QuoteLineItem } from "@/src/lib/ai/schema";

export type CalculatedQuote = {
  computedSubtotal: number | null;
  computedDiscount: number | null;
  computedTax: number | null;
  computedExtraCharges: number;
  computedGrandTotal: number | null;
  sourceGrandTotal: number | null;
  totalMismatch: {
    detected: boolean;
    difference: number | null;
  };
  incomplete: boolean;
  missingForCalculation: string[];
};

function toMinorUnits(amount: number) {
  const minor = Math.round((amount + Number.EPSILON) * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}

function fromMinorUnits(amount: number | null) {
  return amount === null ? null : amount / 100;
}

function percentageOf(amountMinor: number, percentage: number) {
  const basisPoints = Math.round((percentage + Number.EPSILON) * 100);
  return Math.round((amountMinor * basisPoints) / 10_000);
}

function unique(items: string[]) {
  return [...new Set(items)];
}

function moneyToMinor(
  money: Money | undefined,
  expectedCurrency: string,
  path: string,
  missing: string[],
  required: boolean,
) {
  if (!money || money.amount === null) {
    if (required) missing.push(path);
    return null;
  }
  if (money.currency && money.currency !== expectedCurrency) {
    missing.push(`${path}.currency`);
    return null;
  }
  const minor = toMinorUnits(money.amount);
  if (minor === null) missing.push(path);
  return minor;
}

function lineDiscountMinor(
  item: QuoteLineItem,
  lineSubtotalMinor: number,
  currency: string,
  path: string,
  missing: string[],
) {
  if (item.discountAmount?.amount !== null && item.discountAmount?.amount !== undefined) {
    return moneyToMinor(item.discountAmount, currency, `${path}.discountAmount`, missing, true) ?? 0;
  }
  if (item.discountPercent !== null && item.discountPercent !== undefined) {
    return percentageOf(lineSubtotalMinor, item.discountPercent);
  }
  return 0;
}

export function calculateQuote(quote: ExtractedQuotation): CalculatedQuote {
  const missing: string[] = [];
  const currency = quote.currency;
  if (!currency) missing.push("currency");
  const calculationCurrency = currency ?? "__missing__";

  const lines = quote.lineItems.map((item, index) => {
    const path = `lineItems.${index}`;
    if (item.quantity === null) missing.push(`${path}.quantity`);
    const unitPrice = moneyToMinor(item.unitPrice, calculationCurrency, `${path}.unitPrice`, missing, true);
    if (item.quantity === null || unitPrice === null) return null;
    const subtotal = Math.round(unitPrice * item.quantity);
    if (!Number.isSafeInteger(subtotal)) {
      missing.push(`${path}.subtotal`);
      return null;
    }
    const discount = lineDiscountMinor(item, subtotal, calculationCurrency, path, missing);
    return { item, subtotal, discount, net: Math.max(0, subtotal - discount) };
  });

  const allLinesComplete = lines.every((line) => line !== null);
  const subtotalMinor = allLinesComplete
    ? lines.reduce((sum, line) => sum + (line?.subtotal ?? 0), 0)
    : null;
  const hasLineDiscount = quote.lineItems.some((item) =>
    item.discountPercent !== null && item.discountPercent !== undefined
    || item.discountAmount?.amount !== null && item.discountAmount?.amount !== undefined,
  );
  let discountMinor: number | null = null;
  if (subtotalMinor !== null) {
    discountMinor = hasLineDiscount
      ? lines.reduce((sum, line) => sum + (line?.discount ?? 0), 0)
      : moneyToMinor(quote.discountShown, calculationCurrency, "discountShown", missing, false) ?? 0;
  }

  let taxMinor: number | null = null;
  if (subtotalMinor !== null && discountMinor !== null) {
    if (quote.tax.includedInPrice === true) {
      taxMinor = 0;
    } else {
      const lineTaxValues = quote.lineItems.map((item) => item.taxPercent);
      const hasAnyLineTax = lineTaxValues.some((value) => value !== null && value !== undefined);
      const hasEveryLineTax = lineTaxValues.every((value) => value !== null && value !== undefined);
      if (hasEveryLineTax && lines.every((line) => line !== null)) {
        taxMinor = lines.reduce((sum, line) => sum + percentageOf(line?.net ?? 0, line?.item.taxPercent ?? 0), 0);
      } else if (quote.tax.percent !== null && quote.tax.percent !== undefined) {
        taxMinor = percentageOf(Math.max(0, subtotalMinor - discountMinor), quote.tax.percent);
      } else if (quote.tax.amountShown?.amount !== null && quote.tax.amountShown?.amount !== undefined) {
        taxMinor = moneyToMinor(quote.tax.amountShown, calculationCurrency, "tax.amountShown", missing, true);
      } else {
        missing.push(hasAnyLineTax ? "lineItems.taxPercent" : "tax");
      }
    }
  }

  const extras: number[] = [];
  for (const [label, money] of [["shipping", quote.shipping], ["installation", quote.installation]] as const) {
    const value = moneyToMinor(money, calculationCurrency, label, missing, Boolean(money));
    if (value !== null) extras.push(value);
  }
  quote.otherCharges?.forEach((charge, index) => {
    const value = moneyToMinor(charge.amount, calculationCurrency, `otherCharges.${index}.amount`, missing, true);
    if (value !== null) extras.push(value);
  });
  const extrasMinor = extras.reduce((sum, value) => sum + value, 0);

  const missingForCalculation = unique(missing);
  const incomplete = missingForCalculation.length > 0 || subtotalMinor === null || discountMinor === null || taxMinor === null;
  const grandTotalMinor = incomplete
    ? null
    : Math.max(0, (subtotalMinor ?? 0) - (discountMinor ?? 0) + (taxMinor ?? 0) + extrasMinor);
  const sourceGrandTotalMinor = quote.grandTotalShown?.amount === null || quote.grandTotalShown?.amount === undefined
    ? null
    : toMinorUnits(quote.grandTotalShown.amount);
  const mismatchMinor = grandTotalMinor !== null && sourceGrandTotalMinor !== null
    ? sourceGrandTotalMinor - grandTotalMinor
    : null;

  return {
    computedSubtotal: fromMinorUnits(subtotalMinor),
    computedDiscount: fromMinorUnits(discountMinor),
    computedTax: fromMinorUnits(taxMinor),
    computedExtraCharges: fromMinorUnits(extrasMinor) ?? 0,
    computedGrandTotal: fromMinorUnits(grandTotalMinor),
    sourceGrandTotal: fromMinorUnits(sourceGrandTotalMinor),
    totalMismatch: {
      detected: mismatchMinor !== null && mismatchMinor !== 0,
      difference: fromMinorUnits(mismatchMinor),
    },
    incomplete,
    missingForCalculation,
  };
}
