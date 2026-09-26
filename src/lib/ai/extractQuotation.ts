import "server-only";

import { GoogleGenAI } from "@google/genai";
import {
  extractedQuotationJsonSchema,
  extractedQuotationSchema,
  type ExtractedQuotation,
} from "@/src/lib/ai/schema";
import { QUOTATION_EXTRACTION_PROMPT } from "@/src/lib/ai/prompt";

type GenerateRequest = Parameters<GoogleGenAI["models"]["generateContent"]>[0];
type Generate = (request: GenerateRequest) => Promise<{ text?: string }>;

export type ExtractionErrorCode =
  | "configuration"
  | "timeout"
  | "rate_limited"
  | "api_unavailable"
  | "invalid_response";

export class QuotationExtractionError extends Error {
  constructor(
    public readonly code: ExtractionErrorCode,
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "QuotationExtractionError";
  }
}

type ExtractQuotationInput = {
  bytes: Uint8Array;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
  model?: string;
};

type ExtractionDependencies = {
  apiKey?: string;
  generateContent?: Generate;
  timeoutMs?: number;
};

function classifyApiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes("429") || normalized.includes("quota") || normalized.includes("rate")) {
    return new QuotationExtractionError("rate_limited", message, "Quotation reading is busy. Please try again in a moment.");
  }
  if (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("abort")) {
    return new QuotationExtractionError("timeout", message, "Reading took too long. Please try again.");
  }
  return new QuotationExtractionError("api_unavailable", message, "We could not read this file. Please try again shortly.");
}

export function parseExtractionResponse(text: string): ExtractedQuotation {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new QuotationExtractionError(
      "invalid_response",
      error instanceof Error ? error.message : "Invalid JSON",
      "We could not read the quotation clearly. Please try again.",
    );
  }

  const parsed = extractedQuotationSchema.safeParse(json);
  if (!parsed.success) {
    throw new QuotationExtractionError(
      "invalid_response",
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      "Some quotation details could not be read. Please try again.",
    );
  }
  return parsed.data;
}

export async function extractQuotation(
  input: ExtractQuotationInput,
  dependencies: ExtractionDependencies = {},
): Promise<ExtractedQuotation> {
  const apiKey = dependencies.apiKey ?? process.env.GEMINI_API_KEY;
  if (!dependencies.generateContent && !apiKey) {
    throw new QuotationExtractionError(
      "configuration",
      "GEMINI_API_KEY is missing",
      "Quotation reading is not available yet. Please contact the person who manages QuoteLens.",
    );
  }

  const model = input.model ?? process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const timeoutMs = dependencies.timeoutMs ?? 60_000;
  const generateContent = dependencies.generateContent ?? ((request) => {
    const ai = new GoogleGenAI({ apiKey });
    return ai.models.generateContent(request);
  });

  let response: { text?: string };
  try {
    response = await generateContent({
      model,
      contents: [{
        role: "user",
        parts: [
          { text: QUOTATION_EXTRACTION_PROMPT },
          { inlineData: { mimeType: input.mimeType, data: Buffer.from(input.bytes).toString("base64") } },
        ],
      }],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseJsonSchema: extractedQuotationJsonSchema,
        httpOptions: { timeout: timeoutMs },
      },
    });
  } catch (error) {
    if (error instanceof QuotationExtractionError) throw error;
    throw classifyApiError(error);
  }

  if (!response.text?.trim()) {
    throw new QuotationExtractionError(
      "invalid_response",
      "Gemini response did not contain text",
      "No details could be read from this quotation. Please try again.",
    );
  }
  return parseExtractionResponse(response.text);
}
