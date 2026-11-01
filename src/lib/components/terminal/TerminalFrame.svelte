<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    title,
    titleIcon,
    meta,
    onBack,
    backDisabled = false,
    double = false,
    className = "",
    children,
    footer,
  }: {
    title: string;
    titleIcon?: Snippet;
    meta?: string;
    onBack?: () => void;
    backDisabled?: boolean;
    double?: boolean;
    className?: string;
    children: Snippet;
    footer?: Snippet;
  } = $props();
</script>

<section
  class="terminal-frame {className}"
  box-={double ? "double" : "round"}
  shear-="top"
  class:double
>
  <header class="frame-header">
    <h1>
      {#if onBack}<button
          type="button"
          class="text-button back-button"
          onclick={onBack}
          disabled={backDisabled}
          aria-label="Back">←</button
        >{/if}
      {#if titleIcon}{@render titleIcon()}{/if}
      {title}
    </h1>
    {#if meta}<span class="frame-meta">{meta}</span>{/if}
  </header>
  {@render children()}
  {#if footer}<footer class="status-bar">{@render footer()}</footer>{/if}
</section>
