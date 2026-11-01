<script lang="ts">
  import dayjs from "dayjs";
  import { shouldIgnoreListShortcut } from "../../lib/utils/keyboard";
  import { onMount, tick } from "svelte";
  import pkg from "../../../package.json";
  import TerminalFrame from "../../lib/components/terminal/TerminalFrame.svelte";
  import SummaryView from "../../lib/components/SummaryView.svelte";
  import TrackedTaskCard from "../../lib/components/TrackedTaskCard.svelte";
  import { settingsStore } from "../../lib/stores/settingsStore";
  import { taskStore } from "../../lib/stores/taskStore";
  import { summarizeTasks, normalizeTitle } from "../../lib/utils/summarize";
  import { totalDuration, taskMinutes } from "../../lib/utils/task-display";
  import TaskForm from "../../lib/components/tasks/TaskForm.svelte";

  type Period = "daily" | "weekly" | "monthly" | "custom" | "all";
  let tasks: ITrackedTask[] = $state([]);
  let period = $state<Period>("daily");
  let selectedDate = $state(dayjs().format("YYYY-MM-DD"));
  let rangeEnd = $state(dayjs().format("YYYY-MM-DD"));
  let editing: ITrackedTask | null = $state(null);
  let creating = $state(false);
  let view: "list" | "summary" = $state("list");
  let summary: ISummaryGroup[] = $state([]);
  let selected = $state(-1);
  let loading = $state(true);
  let message = $state("");
  let error = $state("");
  let fileInput: HTMLInputElement;
  let periodSelect = $state<HTMLSelectElement>();
  let taskList = $state<HTMLDivElement>();
  let loadVersion = 0;
  let periodVersion = 0;
  let keyboardActionPending = false;
  const total = $derived(totalDuration(tasks));
  const minutes = $derived(tasks.reduce((sum, task) => sum + taskMinutes(task), 0));
  const rangeInvalid = $derived(
    (period !== "all" && !selectedDate) ||
      (period === "custom" && (!rangeEnd || rangeEnd < selectedDate))
  );
  const dataUnavailable = $derived(loading || rangeInvalid);
  const periodLabel = $derived(
    period === "all"
      ? "all time"
      : period === "custom"
        ? `${dayjs(selectedDate).format("MMM D")} – ${dayjs(rangeEnd).format("MMM D, YYYY")}`
        : period === "weekly"
          ? `${dayjs(selectedDate).startOf("week").format("MMM D")} – ${dayjs(selectedDate).endOf("week").format("MMM D, YYYY")}`
          : period === "monthly"
            ? dayjs(selectedDate).format("MMMM YYYY")
            : `${dayjs(selectedDate).isSame(dayjs(), "day") ? "today" : dayjs(selectedDate).format("dddd")} · ${dayjs(selectedDate).format("DD MMM YYYY")}`
  );
  const summaryMinutes = $derived(
    new Map(
      summary.map((group) => [
        group.title,
        tasks
          .filter((task) => normalizeTitle(task.title) === normalizeTitle(group.title))
          .reduce((sum, task) => sum + taskMinutes(task), 0),
      ])
    )
  );

  $effect(() => {
    if (taskList) {
      taskList.focus({ preventScroll: true });
    }
  });

  async function load(resetSelection = false) {
    const version = ++loadVersion;
    if (rangeInvalid) {
      tasks = [];
      summary = [];
      selected = -1;
      loading = false;
      return;
    }
    loading = true;
    error = "";
    try {
      const data = await taskStore.getTasks(period, selectedDate, selectedDate, rangeEnd);
      const groups = await summarizeTasks(data);
      if (version !== loadVersion) return;
      const selectedId = resetSelection ? undefined : tasks[selected]?.id;
      tasks = data;
      summary = groups;
      const previousIndex = data.findIndex((task) => task.id === selectedId);
      selected = previousIndex >= 0 ? previousIndex : data.length - 1;
    } catch {
      if (version === loadVersion) {
        tasks = [];
        summary = [];
        selected = -1;
        error = "Could not load tasks.";
      }
    } finally {
      if (version === loadVersion) {
        loading = false;
        await scrollToSelectedTask();
      }
    }
  }
  onMount(() => {
    let active = true;
    const unwatch = taskStore.watchTasks(() => {
      void load();
    });
    (async () => {
      try {
        const settings = await settingsStore.getSettings();
        if (!active) return;
        if (settings.defaultToRecentDay) {
          const recent = await taskStore.findMostRecentDateWithTasks();
          if (!active) return;
          if (recent) selectedDate = dayjs(recent).format("YYYY-MM-DD");
        }
        await load();
      } catch {
        error = "Could not load settings.";
        loading = false;
      }
    })();
    return () => {
      active = false;
      loadVersion++;
      periodVersion++;
      unwatch();
    };
  });

  async function setPeriod(value: Period) {
    const version = ++periodVersion;
    loadVersion++;
    period = value;
    loading = true;
    let settingsFailed = false;
    try {
      if (value === "daily") {
        const settings = await settingsStore.getSettings();
        if (version !== periodVersion) return;
        if (settings.defaultToRecentDay) {
          const recent = await taskStore.findMostRecentDateWithTasks();
          if (version !== periodVersion) return;
          selectedDate = dayjs(recent ?? new Date()).format("YYYY-MM-DD");
        }
      }
    } catch {
      settingsFailed = true;
    }
    if (version !== periodVersion) return;
    await load(true);
    if (version === periodVersion && settingsFailed && !error)
      error = "Could not load settings. Showing the selected date.";
  }
  async function moveDate(direction: number) {
    if (period === "all" || period === "custom") return;
    const unit = period === "weekly" ? "week" : period === "monthly" ? "month" : "day";
    selectedDate = dayjs(selectedDate).add(direction, unit).format("YYYY-MM-DD");
    await load(true);
  }
  function cancel() {
    editing = null;
    creating = false;
  }
  async function newTask() {
    if (rangeInvalid) return;
    try {
      const start = await taskStore.getLatestStartTime(selectedDate || new Date());
      creating = true;
      editing = {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        status: "pending",
        createdAt: dayjs().toISOString(),
        start,
        end: null,
      };
    } catch {
      error = "Could not create task.";
    }
  }
  async function save(task: ITrackedTask) {
    const isNewTask = creating;
    if (creating) await taskStore.addTask(task);
    else await taskStore.updateTask(task);
    cancel();
    await load(isNewTask);
  }
  async function remove(id: string) {
    if (dataUnavailable) return;
    try {
      await taskStore.deleteTask(id);
      if (editing?.id === id) cancel();
      await load();
    } catch {
      error = "Could not delete task.";
    }
  }
  async function resume(task: ITrackedTask) {
    if (dataUnavailable) return;
    try {
      await taskStore.addTask({ title: task.title, description: task.description });
      message = "Task resumed for today.";
      await load(true);
    } catch {
      error = "Could not resume task.";
    }
  }
  async function clear() {
    if (
      dataUnavailable ||
      !tasks.length ||
      !confirm(`Clear ${tasks.length} tasks shown for ${periodLabel}? This cannot be undone.`)
    )
      return;
    try {
      // Use the displayed tasks so clearing a past period never deletes today's tasks.
      const ids = new Set(tasks.map((task) => task.id));
      const all = await taskStore.getTasks();
      await taskStore.saveTasks(all.filter((task) => !ids.has(task.id)));
      await load();
      message = "Tasks cleared.";
    } catch {
      error = "Could not clear tasks.";
    }
  }
  function download() {
    if (dataUnavailable) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${period}-tasks-${selectedDate}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message = `Exported ${tasks.length} tasks.`;
  }
  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = await taskStore.importTasks(JSON.parse(await file.text()));
      if (result.success) {
        message = result.message;
        error = "";
        await load();
      } else error = result.message;
    } catch {
      error = "Import failed. Choose a valid task JSON file.";
    } finally {
      input.value = "";
    }
  }
  async function copySummary() {
    if (dataUnavailable) return;
    try {
      await navigator.clipboard.writeText(
        summary
          .map((group) => `${group.title}\n${group.tasks.map((task) => `- ${task}`).join("\n")}`)
          .join("\n\n")
      );
      message = "Summary copied.";
    } catch {
      error = "Could not copy summary.";
    }
  }
  async function handleKey(event: KeyboardEvent) {
    if (editing || event.defaultPrevented) return;
    if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.isComposing) {
      if (!["e", "n", "i", "p"].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      switch (event.key) {
        case "e":
          download();
          break;
        case "n":
          await newTask();
          break;
        case "i":
          fileInput.click();
          break;
        case "p":
          periodSelect?.focus();
          break;
      }
      return;
    }
    if (event.key === "Escape") {
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey)
        return;
      event.preventDefault();
      window.close();
      return;
    }
    if (shouldIgnoreListShortcut(event)) return;
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
      case "h":
        await moveDate(-1);
        break;
      case "l":
        view = "list";
        break;
      case "s":
        view = "summary";
        break;
      case "w":
        await setPeriod(period === "weekly" ? "daily" : "weekly");
        break;
      case "v":
        view = view === "list" ? "summary" : "list";
        break;
      case "n":
        await newTask();
        break;
      case "e":
      case "Enter":
        if (view === "list" && !dataUnavailable && tasks[selected]) {
          creating = false;
          editing = tasks[selected];
        }
        break;
      case "r":
      case "d": {
        if (view !== "list" || dataUnavailable || event.repeat || keyboardActionPending) return;
        const task = tasks[selected];
        if (!task) return;
        event.preventDefault();
        keyboardActionPending = true;
        try {
          if (event.key === "r") {
            if (confirm(`Resume "${task.title}"? A new task will be added for today.`))
              await resume(task);
          } else if (confirm(`Delete "${task.title}"? This cannot be undone.`)) {
            await remove(task.id);
          }
        } finally {
          keyboardActionPending = false;
        }
        break;
      }
      case "y":
        await copySummary();
        break;
      case "x":
        download();
        break;
    }
    await scrollToSelectedTask();
  }
  async function scrollToSelectedTask() {
    await tick();
    if (view === "list" && !editing)
      taskList
        ?.querySelector('.timeline-task[aria-current="true"]')
        ?.scrollIntoView({ block: "nearest" });
  }
</script>

<svelte:window onkeydown={handleKey} />
{#if editing}
  <TaskForm
    task={editing}
    onSave={save}
    onCancel={cancel}
    isNewTask={creating}
    onDelete={creating ? undefined : () => remove(editing!.id)}
  />
{:else}
  <TerminalFrame title="tracked-tasks" meta={`ndev v${pkg.version}`}>
    <div class="panel-controls">
      <div class="view-controls">
        <div class="toolbar view-tabs" role="group" aria-label="Task view">
          <button
            type="button"
            class="text-button"
            class:active={view === "list"}
            aria-pressed={view === "list"}
            aria-keyshortcuts="l"
            onclick={() => (view = "list")}>list</button
          ><button
            type="button"
            class="text-button"
            class:active={view === "summary"}
            aria-pressed={view === "summary"}
            aria-keyshortcuts="s"
            onclick={() => (view = "summary")}>summary</button
          >
        </div>
        <select
          aria-label="Time range"
          aria-keyshortcuts="Control+p"
          bind:this={periodSelect}
          value={period}
          onchange={(event) => setPeriod(event.currentTarget.value as Period)}
          ><option value="daily">daily</option><option value="weekly">weekly</option><option
            value="monthly">monthly</option
          ><option value="custom">custom range</option><option value="all">all time</option></select
        >
      </div>
      <div class="date-nav">
        <button
          type="button"
          class="text-button"
          onclick={() => moveDate(-1)}
          disabled={period === "all" || period === "custom"}
          aria-label="Previous period"
          title="Previous period [h]">‹</button
        ><span>{periodLabel}</span><button
          type="button"
          class="text-button"
          onclick={() => moveDate(1)}
          disabled={period === "all" || period === "custom"}
          aria-label="Next period"
          title="Next period">›</button
        ><strong class="duration">{total}</strong>
      </div>
      {#if period !== "all"}<div class="date-fields">
          <label class="field"
            ><span>{period === "custom" ? "from" : "jump to date"}</span><input
              type="date"
              bind:value={selectedDate}
              onchange={() => load(true)}
              required
            /></label
          >{#if period === "custom"}<label class="field"
              ><span>to</span><input
                type="date"
                bind:value={rangeEnd}
                min={selectedDate}
                onchange={() => load(true)}
                required
              /></label
            >{/if}
        </div>{/if}
      {#if rangeInvalid}<p class="error" role="alert">! range end must be on or after start</p>{/if}
      <div class="toolbar actions">
        <button
          type="button"
          class="text-button primary"
          onclick={newTask}
          disabled={rangeInvalid}
          aria-keyshortcuts="n Control+n">[+] new</button
        ><button
          type="button"
          class="text-button"
          onclick={() => fileInput.click()}
          aria-keyshortcuts="Control+i">[↑] import</button
        ><button
          type="button"
          class="text-button"
          onclick={download}
          disabled={dataUnavailable}
          aria-keyshortcuts="x Control+e">[↓] export</button
        ><button
          type="button"
          class="text-button danger push"
          onclick={clear}
          disabled={dataUnavailable || !tasks.length}>[×] clear</button
        >
      </div>
    </div>
    {#if error}<p class="hint error" role="alert">! {error}</p>{/if}
    {#if message}<p class="hint" role="status">{message}</p>{/if}
    <div
      class="panel-tasks scroll-area"
      bind:this={taskList}
      tabindex="-1"
      role="region"
      aria-label="Tracked tasks"
      aria-busy={loading}
    >
      {#if loading}<div class="empty-state">loading tasks…</div>
      {:else if rangeInvalid}<div class="empty-state">~ choose a valid date range</div>
      {:else if !tasks.length}<div class="empty-state">
          <span class="prompt">~</span>
          <p>no tasks in this period</p>
          <button
            type="button"
            class="text-button primary"
            onclick={newTask}
            disabled={rangeInvalid}>[n] create a task</button
          >
          <p>or choose another date</p>
        </div>
      {:else if view === "list"}
        {#each tasks as task, index (task.id)}<TrackedTaskCard
            {task}
            selected={selected === index}
            onSelect={() => (selected = index)}
            onEdit={(task) => {
              creating = false;
              editing = task;
            }}
            onDelete={remove}
            onResume={resume}
          />{/each}
        <p class="hint"># click task content to copy</p>
      {:else}
        <div class="summary-total">
          <strong class="duration">{total}</strong><span class="subtle"
            >{tasks.length} tasks · {summary.length} groups</span
          >
          <button type="button" class="text-button" onclick={copySummary}>[y] copy all</button>
        </div>
        {#each summary as group}<SummaryView
            title={group.title}
            items={group.tasks}
            minutes={summaryMinutes.get(group.title) ?? 0}
            totalMinutes={minutes}
          />{/each}
      {/if}
    </div>
    {#snippet footer()}<span class="mode" class:summary={view === "summary"}
        >{view === "summary" ? "SUMMARY" : period.toUpperCase()}</span
      ><span class="count"
        >{view === "summary" ? `${summary.length} groups` : `${tasks.length} tasks`}</span
      ><span class="push muted">l list · s summary · v view</span>{/snippet}
  </TerminalFrame>
{/if}
<input
  type="file"
  bind:this={fileInput}
  accept=".json,application/json"
  onchange={importFile}
  hidden
  aria-label="Import task JSON"
/>

<style>
  .panel-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5lh;
    padding: 0.7lh 1ch 0.5lh;
  }
  .view-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1ch;
  }
  .view-controls select {
    width: auto;
    font-size: 11px;
    padding-block: 0.1lh;
  }
  .date-nav {
    display: flex;
    align-items: center;
    gap: 0.3ch;
  }
  .date-nav > span {
    flex: 1;
    text-align: center;
    font-size: 11px;
  }
  .date-nav > strong {
    margin-left: auto;
  }
  .date-fields {
    display: flex;
    gap: 1ch;
  }
  .date-fields label {
    flex: 1;
    font-size: 10px;
  }
  .date-fields input {
    font-size: 11px;
    padding-block: 0.1lh;
  }
  .actions {
    font-size: 11px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5lh;
  }
  .actions button {
    padding-inline: 0.6ch;
  }
  .panel-tasks {
    display: flex;
    flex-direction: column;
    gap: 0.5lh;
    padding: 0.5lh 1ch;
  }
  .panel-tasks :global(.summary-group) {
    margin-bottom: 0.7lh;
  }
  .summary-total {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3lh 1ch;
    align-items: baseline;
    margin-bottom: 0.5lh;
  }
  .summary-total strong {
    font-size: 28px;
  }
  .summary-total button {
    margin-left: auto;
    font-size: 11px;
  }
  :global(.status-bar .push.muted) {
    font-size: 10px;
  }
</style>
