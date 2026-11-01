import { onDestroy } from "svelte";

/** Component-scoped clipboard feedback; pending writes and timers expire on unmount. */
export function createClipboard() {
  let copied = $state("");
  let timeout: ReturnType<typeof setTimeout>;
  let version = 0;
  let active = true;

  onDestroy(() => {
    active = false;
    clearTimeout(timeout);
  });

  return {
    get copied() {
      return copied;
    },
    async copy(text: string, key: string) {
      const request = ++version;
      clearTimeout(timeout);
      try {
        await navigator.clipboard.writeText(text);
        if (!active || request !== version) return;
        copied = key;
      } catch {
        if (!active || request !== version) return;
        copied = "failed";
      }
      timeout = setTimeout(() => (copied = ""), 2000);
    },
  };
}
