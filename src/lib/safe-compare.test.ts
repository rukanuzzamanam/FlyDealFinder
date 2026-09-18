import { describe, expect, it } from "vitest";
import { safeCompare } from "./safe-compare";

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("correct-password", "correct-password")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(safeCompare("correct-password", "wrongly-password")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(safeCompare("short", "a-much-longer-string")).toBe(false);
  });

  it("returns false when comparing against an empty string", () => {
    expect(safeCompare("", "nonempty")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeCompare("", "")).toBe(true);
  });
});
