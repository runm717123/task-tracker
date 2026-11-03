// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { fakeBrowser } from "wxt/testing/fake-browser";
import TaskForm from "../../tasks/TaskForm.svelte";
import SettingsPage from "../../../../entrypoints/popup/ui/SettingsPage.svelte";
import QuickAdd from "../../../../entrypoints/new-task-form-popup/App.svelte";
import Popup from "../../../../entrypoints/popup/App.svelte";
import { settingsStore } from "../../../stores/settingsStore";
import { taskStore } from "../../../stores/taskStore";

const task: ITrackedTask = {
  id: "task-1",
  title: "Project",
  description: "Fix keyboard navigation",
  createdAt: new Date().toISOString(),
  start: null,
  end: null,
};

function pressEnter(target: HTMLElement, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => fakeBrowser.reset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("shared terminal form behavior", () => {
  it.each([
    ["t", "title *"],
    ["d", "description"],
    ["s", "start"],
    ["e", "end"],
  ])("focuses %s's field from a focused action button", async (key, label) => {
    render(TaskForm, { task, onSave: vi.fn(), onCancel: vi.fn() });
    const cancel = screen.getByRole("button", { name: "[esc] cancel" });
    cancel.focus();
    await fireEvent.keyDown(cancel, { key });
    expect(document.activeElement).toBe(screen.getByLabelText(label));
  });

  it.each(["title *", "description", "start", "end"])(
    "keeps focus in %s when an edit-field letter is typed",
    async (label) => {
      render(TaskForm, { task, onSave: vi.fn(), onCancel: vi.fn() });
      const input = screen.getByLabelText(label);
      input.focus();
      for (const key of ["t", "d", "s", "e"]) {
        await fireEvent.keyDown(input, { key });
        expect(document.activeElement).toBe(input);
      }
      await fireEvent.keyDown(window, { key: "t" });
      expect(document.activeElement).toBe(input);
    }
  );

  it("does not focus task fields for modified, composing or held keys", async () => {
    render(TaskForm, { task, onSave: vi.fn(), onCancel: vi.fn() });
    const cancel = screen.getByRole("button", { name: "[esc] cancel" });
    cancel.focus();
    for (const options of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
      { repeat: true },
    ]) {
      await fireEvent.keyDown(cancel, { key: "t", ...options });
      expect(document.activeElement).toBe(cancel);
    }
  });

  it("uses field shortcuts in the popup editor without running list actions", async () => {
    await taskStore.saveTasks([{ ...task, start: new Date().toISOString() }]);
    render(Popup);
    await fireEvent.click(await screen.findByText("Project"));
    const cancel = screen.getByRole("button", { name: "[esc] cancel" });
    cancel.focus();
    await fireEvent.keyDown(cancel, { key: "d" });
    expect(document.activeElement).toBe(screen.getByLabelText("description"));
    expect(await taskStore.getTasks()).toHaveLength(1);
  });

  it.each(["[esc] cancel", "delete", "Back"])(
    "leaves Enter on %s to native button activation without saving",
    async (name) => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const onDelete = vi.fn();
      render(TaskForm, { task, onSave, onCancel, onDelete });
      const button = screen.getByRole("button", { name });
      button.focus();
      expect(pressEnter(button).defaultPrevented).toBe(false);
      expect(onSave).not.toHaveBeenCalled();
      // DOM test runners do not synthesize the browser's click after Enter.
      await fireEvent.click(button);
      expect(name === "delete" ? onDelete : onCancel).toHaveBeenCalledOnce();
    }
  );

  it("submits from description Ctrl+Enter and from the footer's native submit button", async () => {
    const onSave = vi.fn();
    render(TaskForm, { task, onSave, onCancel: vi.fn() });
    expect(
      pressEnter(screen.getByRole("textbox", { name: "description" }), { ctrlKey: true })
        .defaultPrevented
    ).toBe(true);
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Project" }));
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });

  it.each([{ shiftKey: true }, {}, { altKey: true }, { isComposing: true }])(
    "preserves newline, composition and browser shortcuts: %j",
    (options) => {
      const onSave = vi.fn();
      render(TaskForm, { task, onSave, onCancel: vi.fn() });
      pressEnter(screen.getByRole("textbox", { name: "description" }), options);
      expect(onSave).not.toHaveBeenCalled();
    }
  );

  it("honors native required-field validation on Enter", async () => {
    const onSave = vi.fn();
    render(TaskForm, { task, onSave, onCancel: vi.fn() });
    const title = screen.getByRole("textbox", { name: "title *" });
    await fireEvent.input(title, { target: { value: "" } });
    pressEnter(title);
    expect(onSave).not.toHaveBeenCalled();
    expect(title).toHaveProperty("validity.valueMissing", true);
  });

  it("keeps a failed save open and ignores Escape during a pending save", async () => {
    let rejectSave!: (reason: Error) => void;
    const onSave = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectSave = reject;
        })
    );
    const onCancel = vi.fn();
    render(TaskForm, { task, onSave, onCancel });
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
    rejectSave(new Error("Storage unavailable"));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "[⏎] save" })).toHaveProperty("disabled", false);
  });

  it("does not turn settings Reset Enter into Save", async () => {
    await settingsStore.saveSettings({
      ...settingsStore.getDefaultSettings(),
      taskCreateDefaultValue: { title: "Custom" },
    });
    const save = vi.spyOn(settingsStore, "saveSettings");
    render(SettingsPage, { onCancel: vi.fn() });
    await screen.findByDisplayValue("Custom");
    const reset = screen.getByRole("button", { name: "reset" });
    expect(pressEnter(reset).defaultPrevented).toBe(false);
    expect(save).not.toHaveBeenCalled();
    await fireEvent.click(reset);
    expect(screen.getByPlaceholderText("Default title")).toHaveProperty("value", "No title");
    expect(save).not.toHaveBeenCalled();
  });

  it("preserves quick-add Close Enter and saves through the shared form", async () => {
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    const add = vi.spyOn(taskStore, "addTask");
    render(QuickAdd);
    const title = screen.getByRole("textbox", { name: /title/ });
    await waitFor(() => expect(document.activeElement).toBe(title));
    const button = screen.getByRole("button", { name: "[esc] close" });
    expect(pressEnter(button).defaultPrevented).toBe(false);
    expect(add).not.toHaveBeenCalled();
    await fireEvent.input(title, { target: { value: "Quick task" } });
    pressEnter(title);
    await waitFor(() =>
      expect(add).toHaveBeenCalledWith(expect.objectContaining({ title: "Quick task" }))
    );
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it("keeps Settings mounted when Escape is pressed during a save inside the popup", async () => {
    let finishSave!: () => void;
    vi.spyOn(settingsStore, "saveSettings").mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        })
    );
    render(Popup);
    await fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    await screen.findByLabelText("Work start time");
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    await screen.findByRole("button", { name: "saving…" });
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: /settings/ })).not.toBeNull();
    finishSave();
    await screen.findByRole("button", { name: "Settings" });
  });
});

describe("Markdown descriptions", () => {
  it("toggles bullets and saves Markdown through the editor shortcut", async () => {
    const onSave = vi.fn();
    render(TaskForm, { task, onSave, onCancel: vi.fn() });
    const button = screen.getByRole("button", { name: "Bullet list" });
    await fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("textbox", { name: "description" }).querySelector("ul li")?.textContent
    ).toBe(task.description);
    pressEnter(screen.getByRole("textbox", { name: "description" }), { metaKey: true });
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ description: "- Fix keyboard navigation" })
      )
    );
  });

  it("reopens nested Markdown lists and preserves them on save", async () => {
    const description = "- Parent\n  - Child\n- Another";
    const onSave = vi.fn();
    render(TaskForm, { task: { ...task, description }, onSave, onCancel: vi.fn() });
    const input = screen.getByRole("textbox", { name: "description" });
    expect(input.querySelector("ul li ul li")?.textContent).toBe("Child");
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ description }));
  });

  it("saves the latest contenteditable change as Markdown", async () => {
    const onSave = vi.fn();
    render(TaskForm, { task, onSave, onCancel: vi.fn() });
    const input = screen.getByRole("textbox", { name: "description" });
    input.querySelector("p")!.textContent = "Updated work";
    await fireEvent.input(input);
    await fireEvent.click(screen.getByRole("button", { name: "Bullet list" }));
    pressEnter(input, { ctrlKey: true });
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ description: "- Updated work" })
      )
    );
  });

  it("loads the default Markdown description for a new task", async () => {
    await settingsStore.saveSettings({
      ...settingsStore.getDefaultSettings(),
      autoFocusDescription: false,
      taskCreateDefaultValue: { description: "- Default fragment" },
    });
    render(TaskForm, {
      task: { ...task, description: "" },
      isNewTask: true,
      onSave: vi.fn(),
      onCancel: vi.fn(),
    });
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "description" }).querySelector("li")?.textContent
      ).toBe("Default fragment")
    );
  });

  it("focuses the description editor when configured for new tasks", async () => {
    await settingsStore.saveSettings({
      ...settingsStore.getDefaultSettings(),
      autoFocusDescription: true,
      taskCreateDefaultValue: { title: "Default title" },
    });
    render(TaskForm, { task, isNewTask: true, onSave: vi.fn(), onCancel: vi.fn() });
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "description" }))
    );
    expect(screen.getByRole("textbox", { name: "title *" })).toHaveProperty(
      "value",
      "Default title"
    );
  });
});

it("saves Markdown bullets from the quick-add window", async () => {
  vi.spyOn(window, "close").mockImplementation(() => {});
  const add = vi.spyOn(taskStore, "addTask");
  render(QuickAdd);
  const title = screen.getByRole("textbox", { name: /title/ });
  await waitFor(() => expect(document.activeElement).toBe(title));
  await fireEvent.input(title, { target: { value: "Quick task" } });
  const input = screen.getByRole("textbox", { name: "description" });
  input.querySelector("p")!.textContent = "Quick fragment";
  await fireEvent.input(input);
  await fireEvent.click(screen.getByRole("button", { name: "Bullet list" }));
  pressEnter(input, { ctrlKey: true });
  await waitFor(() =>
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Quick task", description: "- Quick fragment" })
    )
  );
});

it.each(["", "First fragment\nSecond fragment"])(
  "preserves an existing plain description: %j",
  async (description) => {
    const onSave = vi.fn();
    render(TaskForm, { task: { ...task, description }, onSave, onCancel: vi.fn() });
    const input = screen.getByRole("textbox", { name: "description" });
    expect(input.textContent).toBe(description);
    await fireEvent.click(screen.getByRole("button", { name: "[⏎] save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ description }));
  }
);
