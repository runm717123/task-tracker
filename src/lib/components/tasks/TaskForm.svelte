<script lang="ts">
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import DescriptionEditor from "./DescriptionEditor.svelte";
  import TerminalForm from "../terminal/TerminalForm.svelte";
  import { settingsStore } from "../../stores/settingsStore";
  import { formatDuration, taskMinutes } from "../../utils/task-display";
  import { isEditableTarget, shouldIgnoreListShortcut } from "../../utils/keyboard";

  let {
    task,
    onSave,
    onCancel,
    onDelete,
    isNewTask = false,
  }: {
    task: ITrackedTask;
    onSave: (task: ITrackedTask) => void | Promise<void>;
    onCancel: () => void;
    onDelete?: () => void | Promise<void>;
    isNewTask?: boolean;
  } = $props();

  let title = $state(task.title);
  let description = $state(task.description);
  let start = $state(task.start ? dayjs(task.start).format("YYYY-MM-DDTHH:mm") : "");
  let end = $state(task.end ? dayjs(task.end).format("YYYY-MM-DDTHH:mm") : "");
  let saving = $state(false);
  let loading = $state(isNewTask);
  let error = $state("");
  let titleInput: HTMLInputElement;
  let descriptionInput: DescriptionEditor;
  let startInput: HTMLInputElement;
  let endInput: HTMLInputElement;
  const invalidTime = $derived(!!start && !!end && !dayjs(end).isAfter(dayjs(start)));
  const duration = $derived(formatDuration(taskMinutes({ start, end })));

  onMount(() => {
    let active = true;
    settingsStore
      .getSettings()
      .then((settings) => {
        if (!active) return;
        if (settings.autoFocusDescription) {
          if (isNewTask) title = settings.taskCreateDefaultValue?.title ?? "";
          descriptionInput?.focus();
        } else {
          if (isNewTask) description = settings.taskCreateDefaultValue?.description ?? "";
          titleInput?.focus();
        }
      })
      .catch(() => {
        if (active) titleInput?.focus();
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });

  function focusField(event: KeyboardEvent) {
    if (
      loading ||
      saving ||
      event.repeat ||
      shouldIgnoreListShortcut(event) ||
      isEditableTarget(document.activeElement)
    )
      return;
    const fields: Record<string, { focus: () => void }> = {
      s: startInput,
      e: endInput,
    };
    const input = fields[event.key];
    if (!input) return;
    event.preventDefault();
    input.focus();
  }

  async function save() {
    if (!title.trim() || loading || saving || invalidTime) return;
    saving = true;
    error = "";
    try {
      await onSave({
        ...task,
        title: title.trim(),
        description: description.trim(),
        start: start ? dayjs(start).toISOString() : null,
        end: end ? dayjs(end).toISOString() : null,
      });
    } catch {
      error = "Could not save task. Please try again.";
    } finally {
      saving = false;
    }
  }
</script>

<svelte:window onkeydown={focusField} />
<TerminalForm
  title={isNewTask ? "new task" : "edit task"}
  meta={isNewTask ? "INSERT" : `#${task.id.slice(0, 8)}`}
  {onCancel}
  onSave={save}
  busy={saving}
>
  <label class="field"
    ><span>title *</span><input
      id="title"
      bind:this={titleInput}
      bind:value={title}
      required
      placeholder="What did you work on?"
    /></label
  >
  <DescriptionEditor
    bind:this={descriptionInput}
    bind:value={description}
    disabled={loading || saving}
    onSave={() => void save()}
  />
  <div class="form-grid">
    <label class="field"
      ><span>start</span><input
        type="datetime-local"
        bind:this={startInput}
        bind:value={start}
        aria-keyshortcuts="s"
      /></label
    >
    <label class="field"
      ><span>end</span><input
        type="datetime-local"
        bind:this={endInput}
        bind:value={end}
        aria-keyshortcuts="e"
      /></label
    >
  </div>
  <div class="subtle">
    {#if invalidTime}<span class="error">! end must be after start</span
      >{:else if start && end}<span class="duration">{duration}</span>{:else}<span class="muted"
        ># empty times use automatic task timing</span
      >{/if}
  </div>
  {#if error}<p class="error" role="alert">! {error}</p>{/if}
  {#snippet footer(formId)}
    {#if onDelete}<button
        type="button"
        class="text-button danger"
        onclick={onDelete}
        disabled={saving}>delete</button
      >{:else}<span class="mode">INSERT</span>{/if}
    <button type="button" class="text-button push" onclick={onCancel} disabled={saving}
      >[esc] cancel</button
    >
    <button
      type="submit"
      form={formId}
      class="save-button"
      disabled={!title.trim() || loading || saving || invalidTime}
      >{saving ? "saving…" : "[⏎] save"}</button
    >
  {/snippet}
</TerminalForm>
