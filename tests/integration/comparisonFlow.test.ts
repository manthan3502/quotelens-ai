import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseExtractionResponse } from "@/src/lib/ai/extractQuotation";
import { extractedQuotationSchema } from "@/src/lib/ai/schema";
import { compareQuotes } from "@/src/lib/pricing/compareQuotes";
import { makeExtractedQuotation } from "@/tests/fixtures/extractedQuotation";

describe("mocked quotation comparison flow", () => {
  it("validates extraction, accepts human corrections, and compares verified quotes", () => {
    const firstExtraction = parseExtractionResponse(JSON.stringify(makeExtractedQuotation({
      vendor: { name: "Northstar Systems" },
    })));
    const secondExtraction = parseExtractionResponse(JSON.stringify(makeExtractedQuotation({
      vendor: { name: "PixelPeak Supply" },
    })));

    const firstVerified = extractedQuotationSchema.parse({
      ...firstExtraction,
      paymentTerms: "50% advance, balance on delivery",
    });
    const secondVerified = extractedQuotationSchema.parse({
      ...secondExtraction,
      lineItems: secondExtraction.lineItems.map((item) => ({
        ...item,
        unitPrice: { ...item.unitPrice, amount: 50000 },
      })),
      grandTotalShown: { amount: 591000, currency: "INR" },
      paymentTerms: "Payment before dispatch",
    });

    const result = compareQuotes([
      { id: "first", filename: "first.pdf", quote: firstVerified },
      { id: "second", filename: "second.png", quote: secondVerified },
    ]);

    expect(result.quotes).toHaveLength(2);
    expect(result.quotes[1].labels).toContain("Lowest comparable calculated cost");
    expect(result.quotes[1].warnings).toContain("Total mismatch detected");
    expect(result.normalizedLineItems).toHaveLength(1);
  });
});
