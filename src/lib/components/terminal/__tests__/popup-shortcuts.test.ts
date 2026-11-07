// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { browser } from "wxt/browser";
import Popup from "../../../../entrypoints/popup/App.svelte";

vi.mock("wxt/browser", async (importOriginal) => {
  const original = await importOriginal<typeof import("wxt/browser")>();
  return {
    ...original,
    browser: {
      ...original.browser,
      windows: { ...original.browser.windows, getCurrent: vi.fn() },
      sidePanel: { open: vi.fn() },
    },
  };
});

beforeEach(() => fakeBrowser.reset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

function tab(options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
    ...options,
  });
  (document.activeElement ?? window).dispatchEvent(event);
  return event;
}

it("opens Sidepanel on double Tab within 300 ms and closes the popup after opening", async () => {
  vi.mocked(browser.windows.getCurrent).mockImplementation(async () => ({
    id: 1,
    focused: true,
    alwaysOnTop: false,
    incognito: false,
  }));
  let finishOpen!: () => void;
  const open = vi.mocked(browser.sidePanel.open).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finishOpen = resolve;
      })
  );
  const close = vi.spyOn(window, "close").mockImplementation(() => {});
  render(Popup);
  await screen.findByText("nothing logged today");
  const settings = screen.getByRole("button", { name: "Settings" });
  settings.focus();
  let now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  expect(tab().defaultPrevented).toBe(false);
  now += 300;
  expect(tab().defaultPrevented).toBe(true);
  await waitFor(() => expect(open).toHaveBeenCalledWith({ windowId: 1 }));
  expect(close).not.toHaveBeenCalled();
  finishOpen();
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(tab().defaultPrevented).toBe(false);
});

it.each(["slow", "shift", "ctrl", "repeat", "other key", "blur", "pointer"])(
  "preserves normal Tab behavior after %s",
  async (interruption) => {
    render(Popup);
    await screen.findByText("nothing logged today");
    const settings = screen.getByRole("button", { name: "Settings" });
    settings.focus();
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    tab();
    now += 100;
    if (interruption === "slow") now += 201;
    if (interruption === "shift") tab({ shiftKey: true });
    if (interruption === "ctrl") tab({ ctrlKey: true });
    if (interruption === "repeat") tab({ repeat: true });
    if (interruption === "other key") await fireEvent.keyDown(settings, { key: "x" });
    if (interruption === "blur") await fireEvent.blur(window);
    if (interruption === "pointer") await fireEvent.pointerDown(settings);
    expect(tab().defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(settings);
  }
);

it("keeps double Tab inactive in settings", async () => {
  render(Popup);
  await fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const input = await screen.findByLabelText("Work start time");
  input.focus();
  tab();
  expect(tab().defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(input);
});

it("keeps the popup open and reports an error if the sidepanel cannot open", async () => {
  vi.mocked(browser.windows.getCurrent).mockImplementation(async () => ({
    id: 1,
    focused: true,
    alwaysOnTop: false,
    incognito: false,
  }));
  vi.mocked(browser.sidePanel.open).mockRejectedValue(new Error("Unavailable"));
  const close = vi.spyOn(window, "close").mockImplementation(() => {});
  render(Popup);
  await screen.findByText("nothing logged today");
  vi.spyOn(performance, "now").mockReturnValue(1000);
  tab();
  tab();
  expect((await screen.findByRole("alert")).textContent).toContain("Could not open sidepanel.");
  expect(close).not.toHaveBeenCalled();
});
