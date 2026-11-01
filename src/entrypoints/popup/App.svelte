<script lang="ts">
  import dayjs from "dayjs";
  import { browser } from "wxt/browser";
  import { shouldIgnoreListShortcut } from "../../lib/utils/keyboard";
  import { onMount, tick } from "svelte";
  import { taskStore } from "../../lib/stores/taskStore";
  import { formatDuration, taskMinutes, totalDuration } from "../../lib/utils/task-display";
  import { openTaskPopup } from "../../lib/utils/newTaskFormPopup";
  import TerminalFrame from "../../lib/components/terminal/TerminalFrame.svelte";
  import TaskForm from "../../lib/components/tasks/TaskForm.svelte";
  import SettingsPage from "./ui/SettingsPage.svelte";
  import HelpPage from "./ui/HelpPage.svelte";

  let tasks: ITrackedTask[] = $state([]);
  let view: "list" | "edit" | "settings" | "help" = $state("list");
  let editing: ITrackedTask | null = $state(null);
  let selected = $state(0);
  let loading = $state(true);
  let error = $state("");
  const total = $derived(totalDuration(tasks));

  onMount(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await taskStore.getTasks("daily");
        if (!active) return;
        tasks = data;
        selected = Math.max(0, Math.min(selected, tasks.length - 1));
      } catch {
        error = "Could not load tasks.";
      } finally {
        loading = false;
      }
    };
    void load();
    const unwatch = taskStore.watchTasks(() => {
      void load();
    });
    return () => {
      active = false;
      unwatch();
    };
  });

  function edit(task: ITrackedTask) {
    editing = task;
    view = "edit";
  }
  function back() {
    view = "list";
    editing = null;
  }
  async function remove(task: ITrackedTask) {
    try {
      await taskStore.deleteTask(task.id);
      if (view === "edit") back();
    } catch {
      error = "Could not delete task.";
    }
  }
  async function openSidepanel() {
    try {
      const current = await browser.windows.getCurrent();
      if (current.id) {
        await browser.sidePanel.open({ windowId: current.id });
        window.close();
      }
    } catch {
      error = "Could not open sidepanel.";
    }
  }
  async function handleKey(event: KeyboardEvent) {
    if (view === "edit" || view === "settings" || event.defaultPrevented) return;
    if (event.key === "Escape") {
      view === "list" ? window.close() : back();
      return;
    }
    if (view !== "list" || shouldIgnoreListShortcut(event)) return;
    switch (event.key) {
      case "j":
      case "ArrowDown":
        event.preventDefault();
        selected = Math.min(tasks.length - 1, selected + 1);
        break;
      case "k":
      case "ArrowUp":
        event.preventDefault();
        selected = Math.max(0, selected - 1);
        break;
      case "e":
      case "Enter":
        if (tasks[selected]) edit(tasks[selected]);
        break;
      case "d":
        if (tasks[selected]) void remove(tasks[selected]);
        break;
      case "n":
        void openTaskPopup();
        break;
      case "s":
        view = "settings";
        break;
      case "?":
        view = "help";
        break;
    }
    await tick();
    document.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
  }
</script>

<svelte:window onkeydown={handleKey} />
{#if view === "edit" && editing}
  <TaskForm
    task={editing}
    onSave={async (task) => {
      await taskStore.updateTask(task);
      back();
    }}
    onCancel={back}
    onDelete={() => remove(editing!)}
  />
{:else if view === "settings"}
  <SettingsPage onCancel={back} />
{:else if view === "help"}
  <HelpPage onCancel={back} />
{:else}
  <TerminalFrame title="Task tracker" meta={dayjs().format("ddd DD MMM")}>
    {#snippet titleIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M16 5H3" />
        <path d="M16 12H3" />
        <path d="M11 19H3" />
        <path d="m15 18 2 2 4-4" />
      </svg>
    {/snippet}
    <div class="popup-list scroll-area" role="list" aria-label="Today's tasks">
      {#each tasks as task, index (task.id)}
        <div role="listitem" class="task-row" class:selected={selected === index}>
          <button
            type="button"
            class="row-button"
            aria-current={selected === index ? "true" : undefined}
            onclick={() => {
              selected = index;
              edit(task);
            }}
          >
            <span class="cursor">{selected === index ? "❯" : " "}</span>
            <span class="task-title">{task.title}</span>
            <span class="row-times"
              ><span class="time"
                >{task.start ? dayjs(task.start).format("HH:mm") : "--:--"}–{task.end
                  ? dayjs(task.end).format("HH:mm")
                  : "--:--"}</span
              > <span class="duration">{formatDuration(taskMinutes(task))}</span></span
            >
          </button>
          <button
            type="button"
            class="text-button danger delete-button"
            onclick={() => remove(task)}
            aria-label={`Delete ${task.title}`}>×</button
          >
        </div>
      {:else}
        <div class="empty-state">
          <span class="prompt">~</span>
          <p>{loading ? "loading tasks…" : "nothing logged today"}</p>
          <button type="button" class="text-button primary" onclick={openTaskPopup}
            >[n] new task</button
          >
          <p>or press <kbd>Alt+↑</kbd></p>
        </div>
      {/each}
    </div>
    {#if error}<p class="hint error" role="alert">! {error}</p>{/if}
    <div class="hint">
      <kbd>j/k</kbd> move <kbd>e</kbd> edit <kbd>d</kbd> delete
      <button type="button" class="text-button" onclick={openTaskPopup}>[n] new</button>
    </div>
    {#snippet footer()}
      <span class="mode">NORMAL</span><span class="count">{tasks.length} tasks</span><span
        class="duration">{total}</span
      >
      <button type="button" class="text-button push" onclick={openSidepanel}>sidepanel ⇥</button>
      <button
        type="button"
        class="text-button"
        onclick={() => (view = "settings")}
        aria-label="Settings"
        title="Settings [s]">⚙</button
      >
      <button
        type="button"
        class="text-button"
        onclick={() => (view = "help")}
        aria-label="Help"
        title="Help [?]">?</button
      >
    {/snippet}
  </TerminalFrame>
{/if}

<style>
  .popup-list {
    display: flex;
    flex-direction: column;
    padding: 0.7lh 0;
  }
  .task-row {
    display: flex;
    align-items: center;
    padding-right: 0.5ch;
  }
  .task-row.selected {
    background: var(--surface-selected);
  }
  button.row-button {
    display: grid;
    grid-template-columns: 2ch minmax(0, 1fr) auto;
    gap: 0.5ch;
    width: 100%;
    text-align: left;
    padding: 0.2lh 1ch;
    height: auto;
    color: var(--foreground0);
    background: transparent;
    background-image: none;
    font-size: 12px;
  }
  .task-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cursor {
    color: var(--accent-text);
  }
  .row-times {
    white-space: nowrap;
    font-size: 10px;
  }
  .delete-button {
    padding-inline: 0.5ch;
    opacity: 0.5;
  }
  .task-row:hover .delete-button,
  .delete-button:focus-visible {
    opacity: 1;
  }
</style>
