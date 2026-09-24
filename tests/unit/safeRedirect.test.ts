import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/src/lib/navigation/safeRedirect";

describe("safeRedirectPath", () => {
  it("keeps local application paths", () => {
    expect(safeRedirectPath("/comparisons/123")).toBe("/comparisons/123");
  });

  it.each([null, "", "https://example.com", "//example.com"])(
    "falls back for unsafe value %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/dashboard");
    },
  );
});
