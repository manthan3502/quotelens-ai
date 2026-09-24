# AI extraction design

Gemini has one narrow role: read a supplier quotation and return factual fields matching a fixed schema. It does not calculate the landed cost, recommend a vendor, fill missing values, or convert currencies.

## Structured output

`src/lib/ai/schema.ts` defines the quotation with Zod and produces a Gemini-compatible JSON Schema. The service requests `application/json`, parses the returned text, and validates it with Zod. Empty line items, invalid numeric types, unknown object keys, or missing required structures fail validation.

The prompt requires Gemini to:

- use only information supported by the document;
- preserve unclear wording in source text fields;
- return null for unavailable scalar values;
- avoid inferring GST percentages, warranty, dates, or prices;
- list missing and ambiguous fields;
- extract every meaningful line item.

## Error states

Each quotation records `pending`, `extracting`, `completed`, or `failed`. Friendly errors distinguish configuration, timeout, rate limits, service failures, and invalid structured output. A failed quotation can be retried manually. The application logs identifiers, model, duration, and error category; it does not log keys or document contents.

## Trust model

Passing schema validation means the JSON is structurally usable, not factually correct. The review screen is mandatory. Calculations use `verified_json`, never `extracted_json`.

## Testing

Automated tests inject a mock `generateContent` function. They cover valid output, missing optional values, invalid numbers, invalid shape, empty line items, ambiguous tax, invalid JSON, and API failure classification without spending tokens or requiring a Gemini key.
