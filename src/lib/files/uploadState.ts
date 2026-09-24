export type UploadState = {
  status: "idle" | "error";
  message: string;
};

export const initialUploadState: UploadState = { status: "idle", message: "" };
