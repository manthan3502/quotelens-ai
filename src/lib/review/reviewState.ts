export type ReviewState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialReviewState: ReviewState = { status: "idle", message: "" };
