"use client";

import { useActionState } from "react";
import { initialExtractionState, type ExtractionState } from "@/src/lib/ai/extractionState";

type ExtractionAction = (state: ExtractionState) => Promise<ExtractionState>;

export function ExtractionButton({ action, retry = false }: { action: ExtractionAction; retry?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialExtractionState);

  return (
    <form action={formAction} className="extraction-control">
      <button className="button compact" type="submit" disabled={pending}>
        {pending ? "Reading quotation…" : retry ? "Try Again" : "Read Quotation"}
      </button>
      {state.message ? <span className={state.status === "error" ? "delete-error" : "extraction-success"} role="status">{state.message}</span> : null}
    </form>
  );
}
