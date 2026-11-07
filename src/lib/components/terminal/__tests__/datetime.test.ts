// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import TaskForm from "../../tasks/TaskForm.svelte";
import DateTime from "../../tasks/DateTime.svelte";

afterEach(cleanup);

describe("DateTime", () => {
  it("keeps the combined time input in the Tab order and the date accessible", async () => {
    render(DateTime, { label: "start", value: "2026-11-07T09:35" });
    const date = screen.getByLabelText("start date");
    const time = screen.getByLabelText("start") as HTMLInputElement;
    expect(date.tabIndex).toBe(-1);
    expect(time.tabIndex).toBe(0);
    expect(time.type).toBe("time");
    expect(time.value).toBe("09:35");
    time.focus();
    await fireEvent.keyDown(time, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(time);
    await fireEvent.keyDown(time, { key: "ArrowLeft", altKey: true });
    expect(document.activeElement).toBe(date);
  });

  it("saves edited date and time components as task timestamps", async () => {
    const onSave = vi.fn();
    render(TaskForm, {
      task: {
        id: "test",
        title: "Test",
        description: "",
        createdAt: new Date().toISOString(),
        start: new Date(2026, 10, 7, 9, 35).toISOString(),
        end: null,
      },
      onSave,
      onCancel: vi.fn(),
    });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("title *")));
    await fireEvent.input(screen.getByLabelText("start date"), { target: { value: "2026-11-08" } });
    await fireEvent.input(screen.getByLabelText("start"), { target: { value: "10:45" } });
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ start: new Date(2026, 10, 8, 10, 45).toISOString(), end: null })
    );
  });

  it("requires a time when a date is present and allows empty automatic timing", async () => {
    render(DateTime, { label: "start" });
    const time = screen.getByLabelText("start") as HTMLInputElement;
    expect(time.checkValidity()).toBe(true);
    await fireEvent.input(screen.getByLabelText("start date"), { target: { value: "2026-11-07" } });
    expect(time.value).toBe("00:00");
    await fireEvent.input(time, { target: { value: "" } });
    expect(time.validity.valueMissing).toBe(true);
  });
});
