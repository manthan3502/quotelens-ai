import { describe, expect, it } from "vitest";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import { makeExtractedQuotation } from "@/tests/fixtures/extractedQuotation";

describe("extractedQuotationSchema", () => {
  it("accepts a valid structured quotation", () => {
    expect(extractedQuotationSchema.safeParse(makeExtractedQuotation()).success).toBe(true);
  });

  it("accepts unavailable optional values as null or omitted", () => {
    const quote = makeExtractedQuotation({
      vendor: { name: null, phone: null },
      quotationNumber: null,
      currency: null,
      missingFields: ["vendor.name", "currency"],
    });
    expect(extractedQuotationSchema.safeParse(quote).success).toBe(true);
  });

  it("rejects a numeric field returned as text", () => {
    const quote = makeExtractedQuotation();
    const invalid = { ...quote, lineItems: [{ ...quote.lineItems[0], quantity: "10" }] };
    expect(extractedQuotationSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an invalid object shape", () => {
    const invalid: Record<string, unknown> = { ...makeExtractedQuotation() };
    delete invalid.vendor;
    expect(extractedQuotationSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects an empty line-item list", () => {
    expect(extractedQuotationSchema.safeParse(makeExtractedQuotation({ lineItems: [] })).success).toBe(false);
  });

  it("preserves ambiguous tax wording without inventing a percentage", () => {
    const quote = makeExtractedQuotation({
      tax: { percent: null, rawText: "GST extra" },
      ambiguousFields: ["tax.percent"],
    });
    const parsed = extractedQuotationSchema.parse(quote);
    expect(parsed.tax.percent).toBeNull();
    expect(parsed.tax.rawText).toBe("GST extra");
    expect(parsed.ambiguousFields).toContain("tax.percent");
  });
});
