import { describe, it, expect } from "vitest";
import { removeSimilarDescriptions } from "../remove-similar-descriptions";
import { removeSimilarSentences } from "../remove-similar-sentences";
import { DEFAULT_SIMILARITY_THRESHOLD } from "../similarity";

describe("removeSimilarSentences", () => {
  it("keeps a single fragment", () => {
    expect(removeSimilarSentences(["fix the parser"], DEFAULT_SIMILARITY_THRESHOLD)).toEqual([
      "fix the parser",
    ]);
  });

  it("removes an exact duplicate", () => {
    expect(
      removeSimilarSentences(["fix the parser", "fix the parser"], DEFAULT_SIMILARITY_THRESHOLD)
    ).toEqual(["fix the parser"]);
  });

  it("keeps the longest of two near-duplicates", () => {
    const result = removeSimilarSentences(
      ["fix login bug", "fix login bug in the auth service"],
      DEFAULT_SIMILARITY_THRESHOLD
    );

    expect(result).toEqual(["fix login bug in the auth service"]);
  });

  it("keeps work that only shares a template", () => {
    const fragments = ["Implement user role management", "Implement user settings management"];

    expect(removeSimilarSentences(fragments, DEFAULT_SIMILARITY_THRESHOLD)).toEqual(fragments);
  });
});

describe("removeSimilarDescriptions", () => {
  it("never lets one group affect another group", () => {
    const groups = new Map([
      ["Sprint 10", ["Implement data backup and restore feature"]],
      ["Sprint 11", ["Implement data backup and restore features"]],
    ]);

    const result = removeSimilarDescriptions(groups, DEFAULT_SIMILARITY_THRESHOLD);

    expect(result.get("Sprint 10")).toEqual(["Implement data backup and restore feature"]);
    expect(result.get("Sprint 11")).toEqual(["Implement data backup and restore features"]);
  });

  it("removes near-duplicates inside a group", () => {
    const groups = new Map([["Sprint 10", ["fix login bug", "fix login bug in the auth service"]]]);

    const result = removeSimilarDescriptions(groups, DEFAULT_SIMILARITY_THRESHOLD);

    expect(result.get("Sprint 10")).toEqual(["fix login bug in the auth service"]);
  });

  it("collapses a group of near-duplicates to the longest fragment", () => {
    const groups = new Map([["Sprint 10", ["fix login bug", "fix login bug in the auth service"]]]);

    const result = removeSimilarDescriptions(groups, DEFAULT_SIMILARITY_THRESHOLD);

    expect(result.get("Sprint 10")).toEqual(["fix login bug in the auth service"]);
  });

  it("keeps a group that has a single fragment", () => {
    const groups = new Map([["Sprint 10", ["fix the parser"]]]);

    const result = removeSimilarDescriptions(groups, DEFAULT_SIMILARITY_THRESHOLD);

    expect(result.get("Sprint 10")).toEqual(["fix the parser"]);
  });
});
