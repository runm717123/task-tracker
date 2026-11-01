export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Leave editing, browser shortcuts and native control activation to the browser. */
export function shouldIgnoreListShortcut(event: KeyboardEvent): boolean {
  const target = event.target;
  return (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.isComposing ||
    (target instanceof HTMLElement &&
      (isEditableTarget(target) ||
        (target.closest("button, a") !== null && ["Enter", " "].includes(event.key))))
  );
}
