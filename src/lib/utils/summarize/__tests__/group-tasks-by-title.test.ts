import { describe, it, expect } from "vitest";
import { groupTasksByTitle } from "../group-tasks-by-title";
import { normalizeTasks } from "../preprocess/normalizer";

function parsed(title: string, description = "did some work") {
  return normalizeTasks([
    {
      id: "1",
      title,
      description,
      createdAt: "2025-08-01T08:00:00Z",
      start: null,
      end: null,
    },
  ])[0];
}

describe("groupTasksByTitle", () => {
  it("puts tasks with the same title in one group", () => {
    const tasks = [parsed("Sprint 10"), parsed("Sprint 10")];

    const groups = groupTasksByTitle(tasks);

    expect(groups.size).toBe(1);
    expect(groups.get("Sprint 10")).toHaveLength(2);
  });

  it("keeps different titles in different groups", () => {
    const groups = groupTasksByTitle([parsed("Sprint 10"), parsed("Sprint 11")]);

    expect(groups.size).toBe(2);
    expect([...groups.keys()]).toEqual(["Sprint 10", "Sprint 11"]);
  });

  it("treats titles that differ only in casing or punctuation as the same group", () => {
    const groups = groupTasksByTitle([parsed("Sprint 10"), parsed("sprint 10.")]);

    expect(groups.size).toBe(1);
  });

  it("heads a group with the title as it was first written", () => {
    const groups = groupTasksByTitle([parsed("Sprint 10"), parsed("SPRINT 10")]);

    expect([...groups.keys()]).toEqual(["Sprint 10"]);
  });
});
