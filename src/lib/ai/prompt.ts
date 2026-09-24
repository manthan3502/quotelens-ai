export const QUOTATION_EXTRACTION_PROMPT = `You are extracting factual information from a supplier quotation.

Rules:
- Return only information actually supported by the document.
- Do not calculate missing prices, totals, tax, discounts, dates, or terms.
- Do not infer GST or another tax unless it is explicitly stated.
- Do not convert wording such as "GST extra" into a numeric tax unless the percentage is present.
- Do not invent warranty details, delivery dates, contact details, or currency.
- Preserve ambiguous source wording in rawText or the corresponding text field.
- Use null when a scalar value is unavailable.
- Identify missing fields in missingFields and unclear fields in ambiguousFields.
- Add concise extractionWarnings when the source is internally inconsistent or hard to read.
- Extract every meaningful line item. Keep descriptions faithful to the source.
- Amount fields contain major currency units exactly as displayed, without currency symbols or grouping separators.
- Confidence values, when provided, range from 0 to 1 and describe extraction confidence only.
- Return only structured JSON matching the supplied response schema.`;
