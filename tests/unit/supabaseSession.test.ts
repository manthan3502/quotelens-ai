import { describe, expect, it } from "vitest";
import { hasSupabaseSessionCookie } from "@/src/lib/supabase/session";

describe("hasSupabaseSessionCookie", () => {
  it("finds a Supabase auth cookie among unrelated cookies", () => {
    expect(hasSupabaseSessionCookie([
      { name: "theme" },
      { name: "sb-project-auth-token" },
    ])).toBe(true);
  });

  it("rejects unrelated or incomplete cookie names", () => {
    expect(hasSupabaseSessionCookie([
      { name: "auth-token" },
      { name: "sb-project" },
    ])).toBe(false);
  });
});
