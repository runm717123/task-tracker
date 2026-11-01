import { describe, expect, it } from "vitest";
import { formatDuration, taskMinutes, totalDuration } from "../task-display";

describe("tracked time display", () => {
  it("counts elapsed minutes across midnight", () => {
    expect(taskMinutes({ start: "2026-10-31T23:30:00Z", end: "2026-11-01T01:15:00Z" })).toBe(105);
  });
  it("does not add missing or invalid ranges to totals", () => {
    expect(taskMinutes({ start: null, end: "2026-11-01T01:15:00Z" })).toBe(0);
    expect(taskMinutes({ start: "2026-11-01T01:15:00Z", end: null })).toBe(0);
    expect(taskMinutes({ start: "2026-11-01T01:15:00Z", end: "2026-11-01T00:15:00Z" })).toBe(0);
    expect(taskMinutes({ start: "invalid", end: "invalid" })).toBe(0);
  });
  it.each([
    [0, "0m"],
    [45, "45m"],
    [60, "1h"],
    [125, "2h 5m"],
  ])("formats %i minutes as %s", (minutes, label) => {
    expect(formatDuration(minutes)).toBe(label);
  });
  it("shows zero tracked time for an empty list", () => {
    expect(totalDuration([])).toBe("0m");
  });
});
