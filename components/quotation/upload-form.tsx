"use client";

import { useActionState, useMemo, useState } from "react";
import {
  MAX_QUOTATION_SIZE_BYTES,
  MAX_QUOTATION_SIZE_LABEL,
  MAX_QUOTATIONS,
} from "@/src/lib/files/quotationFiles";
import { initialUploadState, type UploadState } from "@/src/lib/files/uploadState";

type UploadAction = (state: UploadState, formData: FormData) => Promise<UploadState>;

export function UploadForm({ action, existingCount }: { action: UploadAction; existingCount: number }) {
  const [state, formAction, pending] = useActionState(action, initialUploadState);
  const [selected, setSelected] = useState<File[]>([]);
  const [clientError, setClientError] = useState("");
  const remaining = MAX_QUOTATIONS - existingCount;
  const minimum = existingCount === 0 ? 2 : 1;

  const totalSize = useMemo(() => selected.reduce((sum, file) => sum + file.size, 0), [selected]);

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    setSelected(files);
    if (files.length > remaining) {
      setClientError(`Select no more than ${remaining} file${remaining === 1 ? "" : "s"}.`);
      return;
    }
    const oversized = files.find((file) => file.size > MAX_QUOTATION_SIZE_BYTES);
    if (oversized) {
      setClientError(`${oversized.name} is larger than ${MAX_QUOTATION_SIZE_LABEL}.`);
      return;
    }
    setClientError("");
  }

  const invalidCount = selected.length > 0 && (selected.length < minimum || selected.length > remaining);
  const message = clientError || state.message;

  return (
    <form action={formAction} className="upload-panel" aria-busy={pending}>
      <div className="upload-intro"><h3>Upload vendor quotations</h3><p>Upload 2–5 quotations. QuoteLens will read prices, taxes, delivery, warranty and other details for you to check.</p></div>
      <label className="upload-dropzone">
        <span className="upload-icon" aria-hidden="true">↑</span>
        <span style={{ fontWeight: 800 }}>Choose Quotations</span>
        <span className="muted" style={{ fontSize: 14 }}>
          {existingCount === 0 ? "Select 2–5 files" : `Add up to ${remaining} more`} · PDF, PNG, JPG, or JPEG · {MAX_QUOTATION_SIZE_LABEL} each
        </span>
        <input
          aria-label="Choose Quotations"
          name="files"
          type="file"
          accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
          multiple={remaining > 1}
          required
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>

      {selected.length > 0 ? (
        <div className="selected-files">
          {selected.map((file) => (
            <div key={`${file.name}-${file.lastModified}`}><span>{file.name}</span><span className="muted">{(file.size / (1024 * 1024)).toFixed(1)} MB</span></div>
          ))}
          <div className="selected-total"><strong>{selected.length} selected</strong><span className="muted">{(totalSize / (1024 * 1024)).toFixed(1)} MB total</span></div>
        </div>
      ) : null}

      {message ? <p className="form-error" role="alert">{message}</p> : null}
      {selected.length > 0 && selected.length < minimum ? <p className="form-hint">Select at least {minimum} files to begin this comparison.</p> : null}

      <button className="button" type="submit" disabled={pending || selected.length === 0 || invalidCount || Boolean(clientError)}>
        {pending ? "Uploading securely…" : selected.length ? `Upload ${selected.length} quotation${selected.length === 1 ? "" : "s"}` : "Choose files above to continue"}
      </button>
    </form>
  );
}
