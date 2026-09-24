import { describe, expect, it } from "vitest";
import {
  detectQuotationFileType,
  formatFileSize,
  MAX_QUOTATION_SIZE_BYTES,
  sanitizeOriginalFilename,
  validateQuotationFile,
} from "@/src/lib/files/quotationFiles";

describe("quotation file validation helpers", () => {
  it("detects the supported file signatures", () => {
    expect(detectQuotationFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))?.mimeType).toBe("application/pdf");
    expect(detectQuotationFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mimeType).toBe("image/png");
    expect(detectQuotationFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mimeType).toBe("image/jpeg");
  });

  it("rejects bytes without a supported signature", () => {
    expect(detectQuotationFileType(new Uint8Array([0x47, 0x49, 0x46]))).toBeNull();
  });

  it("removes path and unsafe characters from source filenames", () => {
    expect(sanitizeOriginalFilename("folder\\vendor<>quote?.pdf")).toBe("vendor__quote_.pdf");
  });

  it("formats file sizes for the interface", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("accepts a PDF whose name, MIME type, and signature agree", async () => {
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])], "vendor quote.pdf", {
      type: "application/pdf",
    });

    await expect(validateQuotationFile(file)).resolves.toMatchObject({
      mimeType: "application/pdf",
      extension: "pdf",
      safeOriginalFilename: "vendor quote.pdf",
    });
  });

  it("rejects content that is disguised with a supported filename", async () => {
    const file = new File(["not a real image"], "quote.png", { type: "image/png" });
    await expect(validateQuotationFile(file)).rejects.toThrow("does not appear to be a supported document");
  });

  it("rejects files over the configured size limit before reading contents", async () => {
    const file = { name: "large.pdf", size: MAX_QUOTATION_SIZE_BYTES + 1 } as File;
    await expect(validateQuotationFile(file)).rejects.toThrow("larger than 10 MB");
  });
});
