<script lang="ts">
  import dayjs from "dayjs";
  import { createClipboard } from "../utils/clipboard.svelte";
  import { formatDuration, taskMinutes } from "../utils/task-display";

  let {
    task,
    selected = false,
    onSelect,
    onEdit,
    onDelete,
    onResume,
  }: {
    task: ITrackedTask;
    selected?: boolean;
    onSelect?: () => void;
    onEdit: (task: ITrackedTask) => void;
    onDelete: (id: string) => void;
    onResume: (task: ITrackedTask) => void;
  } = $props();
  const clipboard = createClipboard();
  const invalid = $derived(
    !!task.start && !!task.end && !dayjs(task.end).isAfter(dayjs(task.start))
  );
  const links = $derived(task.description.match(/https?:\/\/[^\s<>]+/g) ?? []);
</script>

<article
  class="timeline-task"
  class:selected
  aria-current={selected ? "true" : undefined}
  tabindex="-1"
  onpointerdown={(event) => {
    if (event.button === 0) onSelect?.();
  }}
  onfocusin={() => onSelect?.()}
>
  <button
    type="button"
    class="copy-field time start"
    title="Copy time range"
    onclick={() =>
      clipboard.copy(
        `${task.start ? dayjs(task.start).format("HH:mm") : "--:--"} - ${task.end ? dayjs(task.end).format("HH:mm") : "--:--"}`,
        "time"
      )}>{task.start ? dayjs(task.start).format("HH:mm") : "--:--"}</button
  >
  <span class="dot" class:invalid>{selected ? "◆" : "●"}</span>
  <button
    type="button"
    class="copy-field task-title"
    title="Copy title"
    onclick={() => clipboard.copy(task.title, "title")}>{task.title}</button
  >
  <div class="task-actions">
    <span class="duration" class:error={invalid}
      >{invalid ? "! time" : formatDuration(taskMinutes(task))}</span
    ><button
      type="button"
      class="text-button resume"
      onclick={() => onResume(task)}
      title="Resume task"
      aria-label={`Resume ${task.title}`}>r</button
    ><button
      type="button"
      class="text-button"
      onclick={() => onEdit(task)}
      title="Edit task"
      aria-label={`Edit ${task.title}`}>e</button
    ><button
      type="button"
      class="text-button danger"
      onclick={() => onDelete(task.id)}
      title="Delete task"
      aria-label={`Delete ${task.title}`}>d</button
    >
  </div>
  <span class="end muted">{task.end ? dayjs(task.end).format("HH:mm") : "--:--"}</span>
  <span class="stem">│</span>
  <div class="task-description">
    {#if task.description}<button
        type="button"
        class="copy-field description-text"
        title="Copy description"
        onclick={() => clipboard.copy(task.description, "description")}>{task.description}</button
      >{/if}
    {#each links as link}<a href={link} target="_blank" rel="noopener noreferrer" class="task-link"
        >↗ {link}</a
      >{/each}
    <button
      type="button"
      class="copy-field created"
      title="Copy created time"
      onclick={() => clipboard.copy(dayjs(task.createdAt).format("YYYY-MM-DD HH:mm"), "created")}
      >created {dayjs(task.createdAt).format("MMM D, HH:mm")}</button
    >
    {#if clipboard.copied}<span
        class="copy-notice"
        class:error={clipboard.copied === "failed"}
        role="status"
        >{clipboard.copied === "failed" ? "! could not copy" : `✓ ${clipboard.copied} copied`}</span
      >{/if}
  </div>
</article>

<style>
  .timeline-task {
    display: grid;
    grid-template-columns: 6ch 1ch minmax(0, 1fr) auto;
    column-gap: 1ch;
    padding: 0.3lh 0.5ch;
  }
  .timeline-task.selected {
    background: var(--surface-selected);
  }
  .dot {
    color: var(--accent-text);
  }
  .dot.invalid {
    color: var(--danger);
  }
  .task-title {
    font-weight: 700;
  }
  .task-actions {
    display: flex;
    gap: 0.4ch;
    align-items: baseline;
  }
  .task-actions .text-button {
    padding: 0 0.2ch;
    color: var(--foreground2);
  }
  .task-actions .text-button:hover {
    color: var(--accent-text);
  }
  .task-actions .resume {
    color: var(--success);
  }
  .task-actions .danger,
  .task-actions .danger:hover {
    color: var(--danger);
  }
  .end,
  .start {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .stem {
    color: var(--border-color);
    height: 100%;
  }
  .task-description {
    grid-column: 3 / 5;
    padding-bottom: 0.8lh;
    min-width: 0;
    color: var(--foreground1);
    font-size: 12px;
  }
  .description-text {
    white-space: pre-wrap;
  }
  .end {
    white-space: nowrap;
  }
  .created {
    color: var(--foreground2);
    font-size: 10px;
    margin-top: 0.2lh;
  }
  .task-link {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  }
  .copy-notice {
    color: var(--success);
    font-size: 11px;
  }
  .copy-notice.error {
    color: var(--danger);
  }
  @media (max-width: 360px) {
    .timeline-task {
      column-gap: 0.6ch;
    }
    .task-actions {
      gap: 0.2ch;
    }
  }
</style>
