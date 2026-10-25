import { describe, it, expect } from "vitest";
import {
  DEFAULT_SIMILARITY_THRESHOLD,
  fragmentSimilarity,
  normalizeForComparison,
  overlapCoefficient,
  trigrams,
} from "../similarity";

describe("normalizeForComparison", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeForComparison("Fix the Login, Bug!")).toBe("fix the login bug");
  });

  it("collapses whitespace", () => {
    expect(normalizeForComparison("fix   the\nlogin bug")).toBe("fix the login bug");
  });
});

describe("trigrams", () => {
  it("is empty for empty text", () => {
    expect(trigrams("").size).toBe(0);
    expect(trigrams("   ").size).toBe(0);
  });

  it("produces overlapping trigrams", () => {
    const result = trigrams("fix login");
    expect(result.has("fix")).toBe(true);
    expect(result.has("ix ")).toBe(true);
  });
});

describe("overlapCoefficient", () => {
  it("is 1 for identical sets and 0 for disjoint sets", () => {
    const a = new Set(["a", "b"]);
    const b = new Set(["a", "b"]);
    const c = new Set(["x", "y"]);

    expect(overlapCoefficient(a, b)).toBe(1);
    expect(overlapCoefficient(a, c)).toBe(0);
  });

  it("is 0 when either set is empty", () => {
    expect(overlapCoefficient(new Set(), new Set(["a"]))).toBe(0);
  });
});

describe("fragmentSimilarity", () => {
  it("is 1 for the same text", () => {
    expect(fragmentSimilarity("review PR", "review PR")).toBe(1);
  });

  it("is 0 for unrelated text", () => {
    expect(fragmentSimilarity("review PR", "set up CI/CD")).toBe(0);
  });

  it("recognises the same words in another order", () => {
    expect(
      fragmentSimilarity(
        "Fix issue with import data functionality",
        "Fix issue with data import functionality"
      )
    ).toBeGreaterThan(DEFAULT_SIMILARITY_THRESHOLD);
  });

  it("recognises a fragment that adds a few words", () => {
    expect(
      fragmentSimilarity("fix login bug", "fix login bug in the auth service")
    ).toBeGreaterThan(DEFAULT_SIMILARITY_THRESHOLD);
  });

  it("keeps work that only shares a template apart", () => {
    expect(
      fragmentSimilarity("Implement user role management", "Implement user settings management")
    ).toBeLessThan(DEFAULT_SIMILARITY_THRESHOLD);
  });
});
