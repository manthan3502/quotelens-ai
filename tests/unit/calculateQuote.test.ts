import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/src/lib/pricing/calculateQuote";
import { makeExtractedQuotation } from "@/tests/fixtures/extractedQuotation";

describe("calculateQuote", () => {
  it("calculates subtotal and quotation-level tax in minor units", () => {
    const result = calculateQuote(makeExtractedQuotation());
    expect(result).toMatchObject({
      computedSubtotal: 520000,
      computedDiscount: 0,
      computedTax: 93600,
      computedGrandTotal: 613600,
      incomplete: false,
    });
  });

  it("applies a line discount before tax", () => {
    const quote = makeExtractedQuotation({
      lineItems: [{
        description: "Equipment",
        quantity: 3,
        unitPrice: { amount: 100, currency: "INR" },
        discountPercent: 10,
      }],
      tax: { percent: 18, includedInPrice: false },
      grandTotalShown: undefined,
    });
    expect(calculateQuote(quote)).toMatchObject({
      computedSubtotal: 300,
      computedDiscount: 30,
      computedTax: 48.6,
      computedGrandTotal: 318.6,
    });
  });

  it("adds shipping, installation, and other charges", () => {
    const quote = makeExtractedQuotation({
      tax: { percent: 0, includedInPrice: false },
      shipping: { amount: 20, currency: "INR" },
      installation: { amount: 30, currency: "INR" },
      otherCharges: [{ label: "Handling", amount: { amount: 5.25, currency: "INR" } }],
      grandTotalShown: undefined,
    });
    quote.lineItems[0].taxPercent = undefined;
    expect(calculateQuote(quote).computedExtraCharges).toBe(55.25);
    expect(calculateQuote(quote).computedGrandTotal).toBe(520055.25);
  });

  it("treats an empty optional installation placeholder as no charge", () => {
    const quote = makeExtractedQuotation({
      installation: { amount: null, currency: "INR", rawText: null },
    });
    expect(calculateQuote(quote)).toMatchObject({
      incomplete: false,
      missingForCalculation: [],
      computedGrandTotal: 613600,
    });
  });

  it("requires an amount when an optional charge is mentioned but unresolved", () => {
    const quote = makeExtractedQuotation({
      installation: { amount: null, currency: "INR", rawText: "Installation extra" },
    });
    expect(calculateQuote(quote)).toMatchObject({
      incomplete: true,
      computedGrandTotal: null,
      missingForCalculation: ["installation"],
    });
  });

  it("handles decimal money without binary-float drift", () => {
    const quote = makeExtractedQuotation({
      lineItems: [
        { description: "A", quantity: 1, unitPrice: { amount: 0.1, currency: "USD" } },
        { description: "B", quantity: 1, unitPrice: { amount: 0.2, currency: "USD" } },
      ],
      currency: "USD",
      tax: { percent: 0, includedInPrice: false },
      shipping: undefined,
      grandTotalShown: undefined,
    });
    expect(calculateQuote(quote).computedGrandTotal).toBe(0.3);
  });

  it("marks an essential missing value as incomplete", () => {
    const quote = makeExtractedQuotation();
    quote.lineItems[0].quantity = null;
    const result = calculateQuote(quote);
    expect(result.incomplete).toBe(true);
    expect(result.computedGrandTotal).toBeNull();
    expect(result.missingForCalculation).toContain("lineItems.0.quantity");
  });

  it("marks incompatible money currency within a quote as incomplete", () => {
    const quote = makeExtractedQuotation();
    quote.lineItems[0].unitPrice.currency = "USD";
    const result = calculateQuote(quote);
    expect(result.incomplete).toBe(true);
    expect(result.missingForCalculation).toContain("lineItems.0.unitPrice.currency");
  });

  it("detects a source and computed total mismatch", () => {
    const result = calculateQuote(makeExtractedQuotation({
      grandTotalShown: { amount: 613700, currency: "INR" },
    }));
    expect(result.totalMismatch).toEqual({ detected: true, difference: 100 });
  });
});
