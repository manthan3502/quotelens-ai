import type { ExtractedQuotation } from "@/src/lib/ai/schema";

export const sampleComparisonTitle = "10 Business Laptops - September 2026";

export const sampleVerifiedQuotations: Array<{
  id: string;
  original_filename: string;
  verified_json: ExtractedQuotation;
}> = [
  {
    id: "sample-northstar",
    original_filename: "northstar-systems-quotation.pdf",
    verified_json: {
      vendor: { name: "Northstar Systems", email: "sales@northstar.example", taxId: "GST-FICTIONAL-NS01" },
      quotationNumber: "NS-2026-0912",
      quotationDate: "2026-09-12",
      validUntil: "2026-10-12",
      currency: "INR",
      lineItems: [{ description: "Aster Pro 14 business laptop", brand: "Aster", model: "Pro 14", specification: "16 GB RAM, 512 GB SSD", quantity: 10, unit: "units", unitPrice: { amount: 52000, currency: "INR", rawText: "INR 52,000" }, taxPercent: 18 }],
      subtotalShown: { amount: 520000, currency: "INR" },
      tax: { type: "GST", percent: 18, includedInPrice: false, rawText: "GST 18% extra" },
      shipping: { amount: 0, currency: "INR", rawText: "Free shipping" },
      grandTotalShown: { amount: 613600, currency: "INR" },
      delivery: { days: 7, text: "Within 7 days" },
      warranty: { months: 12, text: "1 year onsite warranty" },
      paymentTerms: "50% advance, balance before dispatch",
      notes: ["Prices valid for 30 days"],
      missingFields: [], ambiguousFields: [], extractionWarnings: [],
    },
  },
  {
    id: "sample-pixelpeak",
    original_filename: "pixelpeak-supply-quotation.png",
    verified_json: {
      vendor: { name: "PixelPeak Supply", phone: "+91 90000 00002", taxId: "GST-FICTIONAL-PP02" },
      quotationNumber: "PPS/Q/774",
      quotationDate: "2026-09-14",
      validUntil: "2026-09-29",
      currency: "INR",
      lineItems: [{ description: "Aster Pro 14 Business Laptop", brand: "Aster", model: "Pro 14", specification: "16GB / 512GB", quantity: 10, unit: "pcs", unitPrice: { amount: 49500, currency: "INR" }, taxPercent: 18 }],
      subtotalShown: { amount: 495000, currency: "INR" },
      tax: { type: "GST", percent: 18, amountShown: { amount: 89100, currency: "INR" }, includedInPrice: false },
      shipping: { amount: 2000, currency: "INR" },
      grandTotalShown: { amount: 586100, currency: "INR" },
      delivery: { days: 15, text: "15 working days" },
      warranty: { months: 36, text: "3 year manufacturer warranty" },
      paymentTerms: "100% payment before delivery",
      missingFields: [], ambiguousFields: [], extractionWarnings: [],
    },
  },
  {
    id: "sample-cedar",
    original_filename: "cedar-office-tech-quote.jpg",
    verified_json: {
      vendor: { name: "Cedar Office Tech", address: "44 Example Market, Pune" },
      quotationNumber: "COT-1188",
      quotationDate: "2026-09-15",
      validUntil: null,
      currency: "INR",
      lineItems: [{ description: "Aster Pro-14 laptop bundle", brand: "Aster", model: "Pro 14", specification: "Laptop, sleeve and wireless mouse", quantity: 10, unit: "sets", unitPrice: { amount: 54000, currency: "INR", rawText: "Tax inclusive" } }],
      subtotalShown: { amount: 540000, currency: "INR" },
      tax: { type: "GST", percent: null, includedInPrice: true, rawText: "Prices inclusive of applicable GST" },
      shipping: { amount: 8000, currency: "INR" },
      grandTotalShown: { amount: 548000, currency: "INR" },
      delivery: { days: 10, text: "Approx. 10 days" },
      warranty: { months: 12, text: "Standard 1 year warranty" },
      paymentTerms: "30% with order; balance on delivery",
      notes: ["Tax breakdown not separately shown"],
      missingFields: ["validUntil", "tax.percent"],
      ambiguousFields: ["tax.percent"],
      extractionWarnings: ["Tax is included but the rate and amount are not itemized"],
    },
  },
];
