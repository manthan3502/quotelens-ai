import { describe, expect, it, vi } from "vitest";
import { makeExtractedQuotation } from "@/tests/fixtures/extractedQuotation";

vi.mock("server-only", () => ({}));

import {
  extractQuotation,
  parseExtractionResponse,
  QuotationExtractionError,
} from "@/src/lib/ai/extractQuotation";

describe("quotation extraction service", () => {
  it("sends inline document data and validates the mocked structured response", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify(makeExtractedQuotation()),
    });

    const result = await extractQuotation(
      { bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf", model: "test-model" },
      { generateContent },
    );

    expect(result.vendor.name).toBe("Northstar Systems");
    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0][0]).toMatchObject({
      model: "test-model",
      config: { responseMimeType: "application/json", temperature: 0 },
      contents: [{ parts: [expect.objectContaining({ text: expect.any(String) }), { inlineData: { mimeType: "application/pdf", data: "AQID" } }] }],
    });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseExtractionResponse("not-json")).toThrowError(QuotationExtractionError);
  });

  it("rejects JSON that does not match the schema", () => {
    expect(() => parseExtractionResponse(JSON.stringify({ vendor: {} }))).toThrowError(QuotationExtractionError);
  });

  it("returns a useful rate-limit error without making a live request", async () => {
    const generateContent = vi.fn().mockRejectedValue(new Error("429 quota exceeded"));
    await expect(extractQuotation(
      { bytes: new Uint8Array([1]), mimeType: "image/png" },
      { generateContent },
    )).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("classifies an unexpected provider failure without a live request", async () => {
    const generateContent = vi.fn().mockRejectedValue(new Error("upstream unavailable"));
    await expect(extractQuotation(
      { bytes: new Uint8Array([1]), mimeType: "application/pdf" },
      { generateContent },
    )).rejects.toMatchObject({
      code: "api_unavailable",
      userMessage: "Gemini could not process this file. Retry shortly.",
    });
  });

  it("requires a server API key when no generator is injected", async () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(extractQuotation({
        bytes: new Uint8Array([1]),
        mimeType: "image/jpeg",
      })).rejects.toMatchObject({ code: "configuration" });
    } finally {
      if (original) process.env.GEMINI_API_KEY = original;
    }
  });
});
