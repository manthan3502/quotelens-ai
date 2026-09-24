import type { ExtractedQuotation, QuoteLineItem } from "@/src/lib/ai/schema";
import { calculateQuote, type CalculatedQuote } from "@/src/lib/pricing/calculateQuote";

export type QuoteComparisonInput = {
  id: string;
  filename: string;
  quote: ExtractedQuotation;
};

export type ComparedQuote = QuoteComparisonInput & {
  calculated: CalculatedQuote;
  differenceFromLowest: number | null;
  labels: string[];
  warnings: string[];
  missingCount: number;
};

export type NormalizedLineItem = {
  key: string;
  description: string;
  vendors: Record<string, QuoteLineItem>;
};

export type QuoteComparison = {
  quotes: ComparedQuote[];
  currencies: string[];
  incompatibleCurrencies: boolean;
  normalizedLineItems: NormalizedLineItem[];
};

function normalizedItemKey(item: QuoteLineItem) {
  return [item.description, item.brand, item.model]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function normalizeLineItems(inputs: QuoteComparisonInput[]) {
  const items = new Map<string, NormalizedLineItem>();
  for (const input of inputs) {
    for (const lineItem of input.quote.lineItems) {
      const key = normalizedItemKey(lineItem) || `item-${items.size + 1}`;
      const existing = items.get(key) ?? { key, description: lineItem.description, vendors: {} };
      existing.vendors[input.id] = lineItem;
      items.set(key, existing);
    }
  }
  return [...items.values()];
}

export function compareQuotes(inputs: QuoteComparisonInput[]): QuoteComparison {
  const calculated = inputs.map((input) => ({ ...input, calculated: calculateQuote(input.quote) }));
  const currencies = [...new Set(inputs.map((input) => input.quote.currency).filter((value): value is string => Boolean(value)))];
  const completeByCurrency = new Map<string, Array<(typeof calculated)[number]>>();

  for (const item of calculated) {
    if (!item.calculated.incomplete && item.calculated.computedGrandTotal !== null && item.quote.currency) {
      const group = completeByCurrency.get(item.quote.currency) ?? [];
      group.push(item);
      completeByCurrency.set(item.quote.currency, group);
    }
  }

  const lowestByCurrency = new Map<string, number>();
  for (const [currency, group] of completeByCurrency) {
    if (group.length >= 2) {
      lowestByCurrency.set(currency, Math.min(...group.map((item) => item.calculated.computedGrandTotal ?? Infinity)));
    }
  }

  const deliveryValues = inputs.map((input) => input.quote.delivery.days).filter((value): value is number => value !== null && value !== undefined);
  const warrantyValues = inputs.map((input) => input.quote.warranty.months).filter((value): value is number => value !== null && value !== undefined);
  const fastestDelivery = deliveryValues.length >= 2 ? Math.min(...deliveryValues) : null;
  const longestWarranty = warrantyValues.length >= 2 ? Math.max(...warrantyValues) : null;
  const incompatibleCurrencies = currencies.length > 1;

  const quotes: ComparedQuote[] = calculated.map((item) => {
    const total = item.calculated.computedGrandTotal;
    const lowest = item.quote.currency ? lowestByCurrency.get(item.quote.currency) : undefined;
    const differenceFromLowest = total !== null && lowest !== undefined ? total - lowest : null;
    const labels: string[] = [];
    const warnings = [...item.quote.extractionWarnings];

    if (differenceFromLowest === 0) labels.push("Lowest comparable calculated cost");
    if (fastestDelivery !== null && item.quote.delivery.days === fastestDelivery) labels.push("Fastest stated delivery");
    if (longestWarranty !== null && item.quote.warranty.months === longestWarranty) labels.push("Longest stated warranty");
    if (item.calculated.missingForCalculation.some((field) => field === "tax" || field.includes("taxPercent"))) warnings.push("Tax information incomplete");
    if (item.calculated.totalMismatch.detected) warnings.push("Total mismatch detected");
    if (!item.quote.paymentTerms || item.quote.ambiguousFields.some((field) => field.toLowerCase().includes("payment"))) warnings.push("Payment terms require review");
    if (item.calculated.incomplete) warnings.push("Calculation incomplete");
    if (incompatibleCurrencies) warnings.push("Currency differs across quotations");

    return {
      ...item,
      differenceFromLowest,
      labels: [...new Set(labels)],
      warnings: [...new Set(warnings)],
      missingCount: new Set([...item.quote.missingFields, ...item.calculated.missingForCalculation]).size,
    };
  });

  return {
    quotes,
    currencies,
    incompatibleCurrencies,
    normalizedLineItems: normalizeLineItems(inputs),
  };
}
