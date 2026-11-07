// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { fakeBrowser } from "wxt/testing/fake-browser";
import Popup from "../../../../entrypoints/popup/App.svelte";

beforeEach(() => fakeBrowser.reset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

it("focuses Sidepanel on double Tab within 300 ms without opening it", async () => {
  render(Popup);
  await screen.findByText("nothing logged today");
  const settings = screen.getByRole("button", { name: "Settings" });
  const sidepanel = screen.getByRole("button", { name: "sidepanel ⇥" });
  settings.focus();
  let now = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  expect(tab().defaultPrevented).toBe(false);
  now += 300;
  expect(tab().defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(sidepanel);
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
