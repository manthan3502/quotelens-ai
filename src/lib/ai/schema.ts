import { z } from "zod";

const nullableText = z.string().trim().min(1).nullable();
const optionalNullableText = nullableText.optional();
const nullableAmount = z.number().finite().nonnegative().nullable();
const optionalPercent = z.number().finite().min(0).max(100).nullable().optional();

export const moneySchema = z.object({
  amount: nullableAmount,
  currency: nullableText,
  rawText: optionalNullableText,
}).strict();

export const quoteLineItemSchema = z.object({
  description: z.string().trim().min(1),
  brand: optionalNullableText,
  model: optionalNullableText,
  specification: optionalNullableText,
  quantity: nullableAmount,
  unit: optionalNullableText,
  unitPrice: moneySchema,
  discountPercent: optionalPercent,
  discountAmount: moneySchema.optional(),
  taxPercent: optionalPercent,
  lineTotalShown: moneySchema.optional(),
  confidence: z.number().finite().min(0).max(1).nullable().optional(),
}).strict();

export const extractedQuotationSchema = z.object({
  vendor: z.object({
    name: nullableText,
    phone: optionalNullableText,
    email: optionalNullableText,
    address: optionalNullableText,
    taxId: optionalNullableText,
  }).strict(),
  quotationNumber: optionalNullableText,
  quotationDate: optionalNullableText,
  validUntil: optionalNullableText,
  currency: nullableText,
  lineItems: z.array(quoteLineItemSchema).min(1),
  subtotalShown: moneySchema.optional(),
  discountShown: moneySchema.optional(),
  tax: z.object({
    type: optionalNullableText,
    percent: optionalPercent,
    amountShown: moneySchema.optional(),
    includedInPrice: z.boolean().nullable().optional(),
    rawText: optionalNullableText,
  }).strict(),
  shipping: moneySchema.optional(),
  installation: moneySchema.optional(),
  otherCharges: z.array(z.object({
    label: z.string().trim().min(1),
    amount: moneySchema,
  }).strict()).optional(),
  grandTotalShown: moneySchema.optional(),
  delivery: z.object({
    days: nullableAmount.optional(),
    text: optionalNullableText,
  }).strict(),
  warranty: z.object({
    months: nullableAmount.optional(),
    text: optionalNullableText,
  }).strict(),
  paymentTerms: optionalNullableText,
  notes: z.array(z.string().trim().min(1)).optional(),
  missingFields: z.array(z.string().trim().min(1)),
  ambiguousFields: z.array(z.string().trim().min(1)),
  extractionWarnings: z.array(z.string().trim().min(1)),
}).strict();

export type Money = z.infer<typeof moneySchema>;
export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>;
export type ExtractedQuotation = z.infer<typeof extractedQuotationSchema>;

const generatedJsonSchema = z.toJSONSchema(extractedQuotationSchema, {
  target: "draft-7",
});

export const extractedQuotationJsonSchema = Object.fromEntries(
  Object.entries(generatedJsonSchema).filter(([key]) => key !== "$schema"),
);
