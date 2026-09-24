import { describe, expect, it } from "vitest";
import { compareQuotes } from "@/src/lib/pricing/compareQuotes";
import { makeExtractedQuotation } from "@/tests/fixtures/extractedQuotation";

function input(id: string, amount: number, currency = "INR") {
  const quote = makeExtractedQuotation({ currency, grandTotalShown: undefined });
  quote.lineItems = [{ description: "Business laptop", quantity: 1, unitPrice: { amount, currency }, taxPercent: 0 }];
  quote.tax = { percent: 0, includedInPrice: false };
  quote.shipping = undefined;
  quote.installation = undefined;
  return { id, filename: `${id}.pdf`, quote };
}

describe("compareQuotes", () => {
  it("identifies the lowest comparable cost and differences", () => {
    const comparison = compareQuotes([input("a", 100), input("b", 125)]);
    expect(comparison.quotes[0].labels).toContain("Lowest comparable calculated cost");
    expect(comparison.quotes[0].differenceFromLowest).toBe(0);
    expect(comparison.quotes[1].differenceFromLowest).toBe(25);
  });

  it("excludes incomplete quotations from lowest-cost comparison", () => {
    const incomplete = input("a", 80);
    incomplete.quote.lineItems[0].quantity = null;
    const comparison = compareQuotes([incomplete, input("b", 100)]);
    expect(comparison.quotes.every((quote) => quote.differenceFromLowest === null)).toBe(true);
    expect(comparison.quotes[0].warnings).toContain("Calculation incomplete");
  });

  it("does not compare totals across incompatible currencies", () => {
    const comparison = compareQuotes([input("a", 100, "INR"), input("b", 1, "USD")]);
    expect(comparison.incompatibleCurrencies).toBe(true);
    expect(comparison.quotes.every((quote) => quote.differenceFromLowest === null)).toBe(true);
    expect(comparison.quotes[0].warnings).toContain("Currency differs across quotations");
  });

  it("adds factual delivery and warranty labels", () => {
    const first = input("a", 100);
    const second = input("b", 110);
    first.quote.delivery.days = 4;
    second.quote.delivery.days = 8;
    first.quote.warranty.months = 12;
    second.quote.warranty.months = 36;
    const comparison = compareQuotes([first, second]);
    expect(comparison.quotes[0].labels).toContain("Fastest stated delivery");
    expect(comparison.quotes[1].labels).toContain("Longest stated warranty");
  });

  it("flags source total mismatches and missing payment terms", () => {
    const first = input("a", 100);
    first.quote.grandTotalShown = { amount: 120, currency: "INR" };
    first.quote.paymentTerms = null;
    const comparison = compareQuotes([first, input("b", 110)]);
    expect(comparison.quotes[0].warnings).toContain("Total mismatch detected");
    expect(comparison.quotes[0].warnings).toContain("Payment terms require review");
  });

  it("normalizes matching line-item descriptions into one row", () => {
    const first = input("a", 100);
    const second = input("b", 110);
    second.quote.lineItems[0].description = "Business  Laptop";
    const comparison = compareQuotes([first, second]);
    expect(comparison.normalizedLineItems).toHaveLength(1);
    expect(Object.keys(comparison.normalizedLineItems[0].vendors)).toEqual(["a", "b"]);
  });
});
