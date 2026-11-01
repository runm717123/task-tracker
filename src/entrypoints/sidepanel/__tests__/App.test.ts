// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { taskStore } from "../../../lib/stores/taskStore";
import { settingsStore } from "../../../lib/stores/settingsStore";
import App from "../App.svelte";

function selectedTitle() {
  return document
    .querySelector('.timeline-task[aria-current="true"] .task-title')
    ?.textContent?.trim();
}

async function openList() {
  render(App);
  await screen.findByRole("button", { name: "Resume Second task" });
}

describe("sidepanel task keyboard actions", () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    await taskStore.saveTasks(
      ["First task", "Second task"].map((title, index) => ({
        id: `task-${index}`,
        title,
        description: `Description for ${title}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        start: new Date(+start + index * 3_600_000).toISOString(),
        end: new Date(+start + (index + 1) * 3_600_000).toISOString(),
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("selects the last task when the list opens", async () => {
    await openList();
    expect(selectedTitle()).toBe("Second task");
  });

  it("selects Summary with s and List with l without moving the date", async () => {
    await openList();
    const date = screen.getByLabelText("jump to date") as HTMLInputElement;
    const value = date.value;
    await fireEvent.keyDown(window, { key: "s" });
    expect(screen.getByRole("button", { name: "summary" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    await fireEvent.keyDown(window, { key: "l" });
    expect(screen.getByRole("button", { name: "list" }).getAttribute("aria-pressed")).toBe("true");
    await fireEvent.keyDown(window, { key: "l" });
    expect(date.value).toBe(value);
    await fireEvent.keyDown(window, { key: "v" });
    expect(screen.getByRole("button", { name: "summary" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  it("exports the displayed tasks with Ctrl+e", async () => {
    await openList();
    const createURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:export");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const event = new KeyboardEvent("keydown", {
      key: "e",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    expect(createURL).toHaveBeenCalledOnce();
    const blob = createURL.mock.calls[0][0] as Blob;
    expect(JSON.parse(await blob.text())).toHaveLength(2);
    expect(screen.queryByRole("textbox", { name: "title *" })).toBeNull();
  });

  it("opens a new task with Ctrl+n", async () => {
    await openList();
    await fireEvent.keyDown(window, { key: "n", ctrlKey: true });
    await screen.findByRole("textbox", { name: "title *" });
    expect(screen.getByRole("heading", { name: /new task/ })).not.toBeNull();
  });

  it("opens the import chooser with Ctrl+i", async () => {
    await openList();
    const click = vi
      .spyOn(screen.getByLabelText("Import task JSON"), "click")
      .mockImplementation(() => {});
    const event = new KeyboardEvent("keydown", { key: "i", ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(click).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("focuses the period selector with Ctrl+p, including from a date input", async () => {
    await openList();
    const date = screen.getByLabelText("jump to date");
    date.focus();
    await fireEvent.keyDown(date, { key: "p", ctrlKey: true });
    const filter = screen.getByRole("combobox", { name: "Time range" });
    expect(document.activeElement).toBe(filter);
    await fireEvent.change(filter, { target: { value: "weekly" } });
    expect(filter).toHaveProperty("value", "weekly");
  });

  it("ignores the new list commands while editing, typing, composing or holding keys", async () => {
    await openList();
    const fileClick = vi
      .spyOn(screen.getByLabelText("Import task JSON"), "click")
      .mockImplementation(() => {});
    const exportFile = vi.spyOn(URL, "createObjectURL");
    for (const key of ["e", "n", "i", "p"]) {
      await fireEvent.keyDown(window, { key, ctrlKey: true, repeat: true });
      await fireEvent.keyDown(window, { key, ctrlKey: true, isComposing: true });
      await fireEvent.keyDown(window, { key, ctrlKey: true, altKey: true });
    }
    const date = screen.getByLabelText("jump to date");
    date.focus();
    await fireEvent.keyDown(date, { key: "s" });
    expect(screen.getByRole("button", { name: "list" }).getAttribute("aria-pressed")).toBe("true");
    await fireEvent.click(screen.getByRole("button", { name: "Edit Second task" }));
    const title = screen.getByRole("textbox", { name: "title *" });
    title.focus();
    for (const key of ["e", "n", "i", "p"]) await fireEvent.keyDown(title, { key, ctrlKey: true });
    expect(document.activeElement).toBe(title);
    expect(exportFile).not.toHaveBeenCalled();
    expect(fileClick).not.toHaveBeenCalled();
  });

  it("selects a clicked task so e edits it, while preserving click-to-copy", async () => {
    await openList();
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const title = screen.getByRole("button", { name: "First task" });
    await fireEvent.pointerDown(title, { button: 0 });
    expect(selectedTitle()).toBe("First task");
    title.focus();
    await fireEvent.click(title);
    expect(selectedTitle()).toBe("First task");
    expect(copy).toHaveBeenCalledWith("First task");
    await fireEvent.keyDown(title, { key: "e" });
    expect(screen.getByRole("textbox", { name: "title *" })).toHaveProperty("value", "First task");
  });

  it.each(["r", "d"])("targets a task clicked on its background with %s", async (key) => {
    await openList();
    screen.getByRole("combobox", { name: "Time range" }).focus();
    const card = screen.getByRole("button", { name: "First task" }).closest("article")!;
    await fireEvent.pointerDown(card, { button: 0 });
    expect(selectedTitle()).toBe("First task");
    card.focus();
    await fireEvent.click(card);
    expect(selectedTitle()).toBe("First task");
    await fireEvent.keyDown(card, { key });
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('"First task"'));
    expect(await taskStore.getTasks()).toHaveLength(2);
  });

  it("selects a task when its controls receive keyboard focus", async () => {
    await openList();
    screen.getByRole("button", { name: "First task" }).focus();
    await waitFor(() => expect(selectedTitle()).toBe("First task"));
  });

  it("sets initial document focus to the task list for keyboard navigation", async () => {
    await openList();
    const list = screen.getByRole("region", { name: "Tracked tasks" });
    expect(document.activeElement).toBe(list);
    await fireEvent.keyDown(list, { key: "ArrowUp" });
    expect(selectedTitle()).toBe("First task");
    await fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(selectedTitle()).toBe("Second task");
  });

  it("closes the sidebar on Escape from the task list", async () => {
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    await openList();
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes the sidebar on Escape while a filter has focus", async () => {
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    await openList();
    const filter = screen.getByRole("combobox", { name: "Time range" });
    filter.focus();
    await fireEvent.keyDown(filter, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });

  it("returns focus to the list when Escape cancels editing, without closing the sidebar", async () => {
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    await openList();
    await fireEvent.click(screen.getByRole("button", { name: "Edit Second task" }));
    const title = screen.getByRole("textbox", { name: "title *" });
    title.focus();
    await fireEvent.keyDown(title, { key: "Escape" });
    await screen.findByRole("button", { name: "Edit Second task" });
    expect(close).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("region", { name: "Tracked tasks" }));
    await fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(selectedTitle()).toBe("First task");
  });

  it("does not steal focus from filters when tasks reload", async () => {
    await openList();
    const filter = screen.getByRole("combobox", { name: "Time range" });
    filter.focus();
    await fireEvent.change(filter, { target: { value: "all" } });
    await waitFor(() => expect(document.querySelector('[aria-busy="false"]')).not.toBeNull());
    expect(document.activeElement).toBe(filter);
  });

  it("asks before resuming and keeps tasks unchanged when cancelled", async () => {
    await openList();
    await fireEvent.keyDown(window, { key: "r" });
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Resume "Second task"'));
    expect(await taskStore.getTasks()).toHaveLength(2);
  });

  it("resumes the selected task after confirmation and selects the new task", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    await openList();
    await fireEvent.keyDown(window, { key: "r" });
    await waitFor(async () => expect(await taskStore.getTasks()).toHaveLength(3));
    await waitFor(() => expect(document.querySelectorAll(".timeline-task")).toHaveLength(3));
    const tasks = await taskStore.getTasks();
    expect(tasks[2]).toMatchObject({
      title: "Second task",
      description: "Description for Second task",
    });
    expect(
      document.querySelector(".timeline-task:last-of-type")?.getAttribute("aria-current")
    ).toBe("true");
  });

  it("asks before deleting and keeps tasks unchanged when cancelled", async () => {
    await openList();
    await fireEvent.keyDown(window, { key: "d" });
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Delete "Second task"'));
    expect(await taskStore.getTasks()).toHaveLength(2);
  });

  it("deletes the selected task after confirmation and selects the remaining last task", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    await openList();
    await fireEvent.keyDown(window, { key: "d" });
    await waitFor(async () => expect(await taskStore.getTasks()).toHaveLength(1));
    await waitFor(() => expect(selectedTitle()).toBe("First task"));
  });

  it("targets the task chosen with keyboard navigation", async () => {
    await openList();
    await fireEvent.keyDown(window, { key: "k" });
    expect(selectedTitle()).toBe("First task");
    await fireEvent.keyDown(window, { key: "r" });
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Resume "First task"'));
  });

  it("keeps the same task selected when an earlier task is removed in storage", async () => {
    await openList();
    const tasks = await taskStore.getTasks();
    await taskStore.saveTasks(tasks.slice(1));
    await waitFor(() => expect(document.querySelectorAll(".timeline-task")).toHaveLength(1));
    expect(selectedTitle()).toBe("Second task");
  });

  it("defaults to the last task again when changing the time range", async () => {
    await openList();
    await fireEvent.keyDown(window, { key: "k" });
    expect(selectedTitle()).toBe("First task");
    await fireEvent.change(screen.getByRole("combobox", { name: "Time range" }), {
      target: { value: "all" },
    });
    await waitFor(() => expect(selectedTitle()).toBe("Second task"));
  });

  it("ignores held keys, summary view and text controls", async () => {
    await openList();
    for (const key of ["r", "d"]) {
      await fireEvent.keyDown(window, { key, repeat: true });
      await fireEvent.keyDown(screen.getByRole("combobox", { name: "Time range" }), { key });
    }
    await fireEvent.click(screen.getByRole("button", { name: "summary" }));
    await fireEvent.keyDown(window, { key: "r" });
    await fireEvent.keyDown(window, { key: "d" });
    expect(window.confirm).not.toHaveBeenCalled();
    expect(await taskStore.getTasks()).toHaveLength(2);
  });

  it("ignores resume and delete shortcuts while editing a task", async () => {
    await openList();
    await fireEvent.click(screen.getByRole("button", { name: "Edit Second task" }));
    const title = screen.getByRole("textbox", { name: "title *" });
    await fireEvent.keyDown(title, { key: "r" });
    await fireEvent.keyDown(title, { key: "d" });
    expect(window.confirm).not.toHaveBeenCalled();
    expect(await taskStore.getTasks()).toHaveLength(2);
  });

  it("focuses editor fields without triggering the sidebar's list commands", async () => {
    await openList();
    await fireEvent.click(screen.getByRole("button", { name: "Edit Second task" }));
    for (const [key, label] of [
      ["t", "title *"],
      ["d", "description"],
      ["s", "start"],
      ["e", "end"],
    ]) {
      const cancel = screen.getByRole("button", { name: "[esc] cancel" });
      cancel.focus();
      await fireEvent.keyDown(cancel, { key });
      expect(document.activeElement).toBe(screen.getByLabelText(label));
    }
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("handles an empty list without prompting", async () => {
    await taskStore.saveTasks([]);
    render(App);
    await screen.findByText("no tasks in this period");
    await fireEvent.keyDown(window, { key: "r" });
    await fireEvent.keyDown(window, { key: "d" });
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("loads all time after the date field is cleared", async () => {
    await openList();
    const tasks = await taskStore.getTasks();
    await taskStore.saveTasks([
      ...tasks,
      {
        ...tasks[0],
        id: "older-task",
        title: "Older task",
        start: "2020-01-01T09:00:00Z",
        end: "2020-01-01T10:00:00Z",
      },
    ]);
    await fireEvent.input(screen.getByLabelText("jump to date"), { target: { value: "" } });
    await fireEvent.change(screen.getByLabelText("jump to date"));
    await screen.findByText("~ choose a valid date range");
    await fireEvent.change(screen.getByRole("combobox", { name: "Time range" }), {
      target: { value: "all" },
    });
    await screen.findByRole("button", { name: "Resume Older task" });
    expect(document.querySelectorAll(".timeline-task")).toHaveLength(3);
    await fireEvent.keyDown(window, { key: "n" });
    await screen.findByRole("textbox", { name: "title *" });
  });

  it("discards stale tasks when a filter fails to load", async () => {
    await openList();
    vi.spyOn(taskStore, "getTasks").mockRejectedValueOnce(new Error("Storage unavailable"));
    await fireEvent.change(screen.getByRole("combobox", { name: "Time range" }), {
      target: { value: "all" },
    });
    await screen.findByText("! Could not load tasks.");
    expect(document.querySelectorAll(".timeline-task")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "[×] clear" })).toHaveProperty("disabled", true);
    await fireEvent.keyDown(window, { key: "d" });
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("blocks stale-data shortcuts while a filter loads or is invalid", async () => {
    await openList();
    const exportFile = vi.spyOn(URL, "createObjectURL");
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    let resolveTasks!: (tasks: ITrackedTask[]) => void;
    vi.spyOn(taskStore, "getTasks").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveTasks = resolve;
        })
    );
    await fireEvent.change(screen.getByRole("combobox", { name: "Time range" }), {
      target: { value: "weekly" },
    });
    await screen.findByText("loading tasks…");
    for (const key of ["x", "y", "e", "r", "d"]) await fireEvent.keyDown(window, { key });
    expect(exportFile).not.toHaveBeenCalled();
    expect(copy).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "title *" })).toBeNull();
    resolveTasks([]);
    await screen.findByText("no tasks in this period");
    await fireEvent.input(screen.getByLabelText("jump to date"), { target: { value: "" } });
    await fireEvent.change(screen.getByLabelText("jump to date"));
    for (const key of ["x", "y", "e", "n", "r", "d"]) await fireEvent.keyDown(window, { key });
    expect(exportFile).not.toHaveBeenCalled();
    expect(copy).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "title *" })).toBeNull();
  });

  it("still loads the selected daily date if recent-day settings cannot load", async () => {
    await openList();
    const filter = screen.getByRole("combobox", { name: "Time range" });
    await fireEvent.change(filter, { target: { value: "weekly" } });
    await screen.findByRole("button", { name: "Resume Second task" });
    vi.spyOn(settingsStore, "getSettings").mockRejectedValueOnce(new Error("Storage unavailable"));
    await fireEvent.change(filter, { target: { value: "daily" } });
    await screen.findByText("! Could not load settings. Showing the selected date.");
    expect(document.querySelectorAll(".timeline-task")).toHaveLength(2);
  });
});
