export const MIN_QUOTATIONS = 2;
export const MAX_QUOTATIONS = 5;
export const MAX_QUOTATION_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_QUOTATION_SIZE_LABEL = "10 MB";

const FILE_TYPES = {
  pdf: { mimeType: "application/pdf", extension: "pdf" },
  png: { mimeType: "image/png", extension: "png" },
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
} as const;

export type ValidatedQuotationFile = {
  file: File;
  mimeType: (typeof FILE_TYPES)[keyof typeof FILE_TYPES]["mimeType"];
  extension: (typeof FILE_TYPES)[keyof typeof FILE_TYPES]["extension"];
  safeOriginalFilename: string;
};

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function detectQuotationFileType(bytes: Uint8Array) {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return FILE_TYPES.pdf;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return FILE_TYPES.png;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return FILE_TYPES.jpeg;
  return null;
}

export function sanitizeOriginalFilename(filename: string) {
  const basename = filename.replace(/\\/g, "/").split("/").pop() ?? "quotation";
  const cleaned = basename
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^\p{L}\p{N}._()\- ]/gu, "_")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "quotation").slice(0, 255);
}

export async function validateQuotationFile(file: File): Promise<ValidatedQuotationFile> {
  if (file.size <= 0) throw new Error(`${file.name || "File"} is empty.`);
  if (file.size > MAX_QUOTATION_SIZE_BYTES) {
    throw new Error(`${file.name} is larger than ${MAX_QUOTATION_SIZE_LABEL}.`);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "png", "jpg", "jpeg"].includes(extension)) {
    throw new Error(`${file.name} must be a PDF, PNG, JPG, or JPEG file.`);
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = detectQuotationFileType(header);
  if (!detected) throw new Error(`${file.name} does not appear to be a supported document.`);

  if (file.type && file.type !== detected.mimeType) {
    throw new Error(`${file.name} has a file type that does not match its contents.`);
  }

  const extensionMatches =
    detected.extension === "jpg" ? extension === "jpg" || extension === "jpeg" : extension === detected.extension;
  if (!extensionMatches) throw new Error(`${file.name} has an extension that does not match its contents.`);

  return {
    file,
    mimeType: detected.mimeType,
    extension: detected.extension,
    safeOriginalFilename: sanitizeOriginalFilename(file.name),
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
