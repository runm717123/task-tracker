<script lang="ts">
  import type { Snippet } from "svelte";
  import TerminalFrame from "./TerminalFrame.svelte";

  let {
    title,
    meta,
    double = false,
    className,
    bodyClass = "",
    busy = false,
    showBack = true,
    onSave,
    onCancel,
    children,
    footer: formFooter,
  }: {
    title: string;
    meta?: string;
    double?: boolean;
    className?: string;
    bodyClass?: string;
    busy?: boolean;
    showBack?: boolean;
    onSave: () => void | Promise<void>;
    onCancel: () => void;
    children: Snippet;
    footer: Snippet<[string]>;
  } = $props();

  const formId = $props.id();
  let form: HTMLFormElement;

  function handleKey(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (!busy) onCancel();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    // Buttons and links must retain their native Enter behavior, including footer actions.
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      !form.contains(target) ||
      target.closest("button, a, select, [contenteditable]")
    )
      return;
    event.preventDefault();
    if (!busy) form.requestSubmit();
  }
</script>

<svelte:window onkeydown={handleKey} />
<TerminalFrame
  {title}
  {meta}
  {double}
  {className}
  onBack={showBack ? onCancel : undefined}
  backDisabled={busy}
>
  <form
    id={formId}
    bind:this={form}
    class="frame-body {bodyClass}"
    onsubmit={(event) => {
      event.preventDefault();
      if (!busy) void onSave();
    }}
  >
    {@render children()}
  </form>
  {#snippet footer()}{@render formFooter(formId)}{/snippet}
</TerminalFrame>
