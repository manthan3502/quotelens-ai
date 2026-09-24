export type ExtractionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialExtractionState: ExtractionState = { status: "idle", message: "" };
