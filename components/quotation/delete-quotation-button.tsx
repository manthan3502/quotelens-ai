"use client";

import { useActionState } from "react";
import { initialUploadState, type UploadState } from "@/src/lib/files/uploadState";

type DeleteAction = (state: UploadState) => Promise<UploadState>;

export function DeleteQuotationButton({ action, filename }: { action: DeleteAction; filename: string }) {
  const [state, formAction, pending] = useActionState(action, initialUploadState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${filename}? This removes the private file and cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <button className="button danger compact" type="submit" disabled={pending} aria-label={`Delete ${filename}`}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.message ? <span className="delete-error" role="alert">{state.message}</span> : null}
    </form>
  );
}
