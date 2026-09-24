import type { ExtractedQuotation } from "@/src/lib/ai/schema";

export function makeExtractedQuotation(
  overrides: Partial<ExtractedQuotation> = {},
): ExtractedQuotation {
  return {
    vendor: { name: "Northstar Systems" },
    quotationNumber: "NS-1042",
    quotationDate: "2026-09-12",
    validUntil: "2026-10-12",
    currency: "INR",
    lineItems: [{
      description: "Business laptop",
      quantity: 10,
      unit: "unit",
      unitPrice: { amount: 52000, currency: "INR", rawText: "₹52,000" },
      taxPercent: 18,
      confidence: 0.98,
    }],
    subtotalShown: { amount: 520000, currency: "INR" },
    tax: { type: "GST", percent: 18, includedInPrice: false, rawText: "GST 18% extra" },
    shipping: { amount: 0, currency: "INR", rawText: "Free shipping" },
    grandTotalShown: { amount: 613600, currency: "INR" },
    delivery: { days: 7, text: "Delivery within 7 days" },
    warranty: { months: 12, text: "1 year warranty" },
    paymentTerms: "50% advance, balance on delivery",
    missingFields: [],
    ambiguousFields: [],
    extractionWarnings: [],
    ...overrides,
  };
}
