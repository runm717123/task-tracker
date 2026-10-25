import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { summarizeTasks } from "../summarize-tasks";
import { mockTasks } from "../../../../mocks/tasks";

const ROOT = path.resolve(__dirname, "../../../../..");

function jsonMock(file: string): ITrackedTask[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")) as ITrackedTask[];
}

function trackedTask(title: string, description: string, id = "1"): ITrackedTask {
  return {
    id,
    title,
    description,
    status: "done",
    createdAt: "2025-08-01T08:00:00Z",
    start: null,
    end: null,
  };
}

describe("summarizeTasks", () => {
  it("returns nothing when there are no tasks", async () => {
    expect(await summarizeTasks([])).toEqual([]);
  });

  it("returns groups of a title and its fragments", async () => {
    const result = await summarizeTasks([trackedTask("Sprint 10", "works on the parser")]);

    expect(result).toEqual([{ title: "Sprint 10", tasks: ["works on the parser"] }]);
  });

  it("puts every task of a title in one group", async () => {
    const result = await summarizeTasks([
      trackedTask("Sprint 10", "works on the parser", "1"),
      trackedTask("Sprint 10", "writes the docs", "2"),
    ]);

    expect(result).toEqual([
      { title: "Sprint 10", tasks: ["works on the parser", "writes the docs"] },
    ]);
  });

  it("keeps different titles in different groups", async () => {
    const result = await summarizeTasks([
      trackedTask("Sprint 10", "works on the parser", "1"),
      trackedTask("Sprint 11", "writes the docs", "2"),
    ]);

    expect(result.map((group) => group.title)).toEqual(["Sprint 10", "Sprint 11"]);
  });

  it("never lets the items of one group affect another group", async () => {
    const result = await summarizeTasks([
      trackedTask("Sprint 10", "Implement data backup and restore feature", "1"),
      trackedTask("Sprint 11", "Implement data backup and restore features", "2"),
    ]);

    expect(result).toEqual([
      { title: "Sprint 10", tasks: ["Implement data backup and restore feature"] },
      { title: "Sprint 11", tasks: ["Implement data backup and restore features"] },
    ]);
  });

  it("keeps a group whose only item is a short description", async () => {
    const result = await summarizeTasks([
      trackedTask("No title 1", "test", "1"),
      trackedTask("No title 1", "sadf", "2"),
      trackedTask("No title 12", "saa", "3"),
    ]);

    expect(result).toEqual([
      { title: "No title 1", tasks: ["test", "sadf"] },
      { title: "No title 12", tasks: ["saa"] },
    ]);
  });

  it("produces the same summary for the same tasks", async () => {
    const tasks = [trackedTask("Sprint 10", "works on the parser"), trackedTask("Sprint 11", "x")];

    expect(await summarizeTasks(tasks)).toEqual(await summarizeTasks(tasks));
  });

  it("needs no model to produce a summary", async () => {
    const result = await summarizeTasks([trackedTask("Sprint 10", "works on the parser")]);

    expect(result.length).toBe(1);
  });
});

describe("summarizeTasks over the mock task data", () => {
  it("summarizes the standard mock tasks", async () => {
    const result = await summarizeTasks(mockTasks);
    const fragments = result.reduce((total, group) => total + group.tasks.length, 0);

    expect(result).toHaveLength(107);
    expect(fragments).toBe(156);
  });

  it("summarizes the sprint mock tasks", async () => {
    const result = await summarizeTasks(jsonMock("src/mocks/mock-tasks.json"));
    const fragments = result.reduce((total, group) => total + group.tasks.length, 0);

    expect(result).toHaveLength(35);
    expect(fragments).toBe(72);
  });

  it("summarizes the junior mock tasks", async () => {
    const result = await summarizeTasks(jsonMock("src/mocks/mock-tasks-junior.json"));
    const fragments = result.reduce((total, group) => total + group.tasks.length, 0);

    expect(result).toHaveLength(17);
    expect(fragments).toBe(106);
  });

  it("summarizes the senior mock tasks", async () => {
    const result = await summarizeTasks(jsonMock("src/mocks/mock-tasks-senior.json"));
    const fragments = result.reduce((total, group) => total + group.tasks.length, 0);

    expect(result).toHaveLength(92);
    expect(fragments).toBe(148);
  });
});

describe("the summary pipeline", () => {
  const summarizeDir = path.resolve(__dirname, "..");

  it("does not depend on a machine learning model", () => {
    const files = fs
      .readdirSync(summarizeDir, { recursive: true })
      .map((entry) => entry.toString())
      .filter((entry) => entry.endsWith(".ts") && !entry.includes("__tests__"));

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = fs.readFileSync(path.join(summarizeDir, file), "utf8");

      expect(source).not.toMatch(/@tensorflow|universal-sentence-encoder|tfjs/);
    }
  });
});
