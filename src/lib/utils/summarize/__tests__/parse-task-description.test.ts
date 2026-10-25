import { describe, it, expect } from "vitest";
import { parseTaskDescription } from "../preprocess/parse-task-description";

describe("parseTaskDescription", () => {
  it("returns nothing for an empty description", () => {
    expect(parseTaskDescription("")).toEqual([]);
  });

  it("keeps free text as a single fragment", () => {
    expect(parseTaskDescription("research and found issue with API rate limiting")).toEqual([
      "research and found issue with API rate limiting",
    ]);
  });

  it("splits a comma separated list", () => {
    expect(parseTaskDescription("item1, item2, item3")).toEqual(["item1", "item2", "item3"]);
  });

  it("splits a bullet list on newlines", () => {
    expect(parseTaskDescription("- item1\n- item2\n- item3")).toEqual(["item1", "item2", "item3"]);
  });

  it("never splits a bullet list on commas", () => {
    expect(parseTaskDescription("- item1, with a detail\n- item2")).toEqual([
      "item1, with a detail",
      "item2",
    ]);
  });

  it("strips the status of a task", () => {
    expect(parseTaskDescription("done - fix the parser")).toEqual(["fix the parser"]);
    expect(parseTaskDescription("fix the parser (done)")).toEqual(["fix the parser"]);
  });

  it("drops lines that are only a link", () => {
    expect(parseTaskDescription("works on the parser\n-https://example.com/issues/1")).toEqual([
      "works on the parser",
    ]);
  });

  it("still splits a comma list when a link is on its own line", () => {
    expect(
      parseTaskDescription("fix the parser, update the docs\n-https://example.com/issues/1")
    ).toEqual(["fix the parser", "update the docs"]);
  });

  it("drops fragments that continue the previous one", () => {
    expect(parseTaskDescription("Fixed the parser bug, which was in the validator")).toEqual([
      "Fixed the parser bug",
    ]);
  });

  it("keeps a fragment that is short", () => {
    expect(parseTaskDescription("ok, write the report")).toEqual(["ok", "write the report"]);
  });

  it("falls back to the whole description when there is no list", () => {
    expect(parseTaskDescription("just a note")).toEqual(["just a note"]);
  });
});
