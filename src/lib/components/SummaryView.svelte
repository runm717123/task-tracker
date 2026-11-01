<script lang="ts">
  import { createClipboard } from "../utils/clipboard.svelte";
  let {
    items,
    title = "Summary",
    minutes = 0,
    totalMinutes = 0,
  }: {
    items: string[];
    title?: string;
    minutes?: number;
    totalMinutes?: number;
  } = $props();
  import { formatDuration } from "../utils/task-display";
  const clipboard = createClipboard();
  const percent = $derived(totalMinutes ? (minutes / totalMinutes) * 100 : 0);
</script>

<section class="summary-group">
  <header>
    <h2>## {title}</h2>
    <button
      type="button"
      class="text-button"
      onclick={() =>
        clipboard.copy(`${title}\n${items.map((item) => `- ${item}`).join("\n")}`, "group")}
      >{clipboard.copied === "group" ? "copied ✓" : "copy"}</button
    >
  </header>
  <div class="group-metrics">
    <div
      is-="progress"
      role="progressbar"
      aria-label={`${title} share of tracked time`}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={`--progress-value: ${percent}; --progress-max: 100;`}
    ></div>
    <span class="duration">{formatDuration(minutes)}</span>
  </div>
  {#if items.length}<ol>
      {#each items as item, index}<li>
          <button
            type="button"
            class="copy-field"
            onclick={() => clipboard.copy(item, String(index))}
            title="Copy task fragment"
            >{item}{#if clipboard.copied === String(index)}
              <span class="copied">✓</span>{/if}</button
          >
        </li>{/each}
    </ol>{:else}<p class="muted">~ no task fragments</p>{/if}
  {#if clipboard.copied === "failed"}<p class="error" role="status">! could not copy</p>{/if}
</section>

<style>
  .summary-group {
    display: flex;
    flex-direction: column;
    gap: 0.3lh;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1ch;
  }
  h2 {
    color: var(--foreground0);
    font: inherit;
    font-weight: 700;
  }
  header button {
    white-space: nowrap;
    font-size: 11px;
  }
  .group-metrics {
    display: flex;
    gap: 2ch;
    align-items: center;
  }
  [is-="progress"] {
    flex: 1;
    --progress-value-background: transparent;
    --progress-value-color: var(--accent);
    --progress-value-content: "████████████████████████████████████████████████████████████████████████████████";
    --progress-empty-background: transparent;
    --progress-empty-color: var(--background2);
    --progress-empty-content: "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░";
  }
  ol {
    padding-left: 4ch;
    color: var(--foreground1);
    font-size: 12px;
  }
  li {
    padding-block: 0.1lh;
  }
  li::marker {
    color: var(--foreground2);
  }
  .copied {
    color: var(--success);
  }
</style>
