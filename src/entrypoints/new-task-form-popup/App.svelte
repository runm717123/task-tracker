<script lang="ts">
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import DescriptionEditor from "../../lib/components/tasks/DescriptionEditor.svelte";
  import TerminalForm from "../../lib/components/terminal/TerminalForm.svelte";
  import { taskStore } from "../../lib/stores/taskStore";
  import { settingsStore } from "../../lib/stores/settingsStore";

  let title = $state("");
  let description = $state("");
  let saving = $state(false);
  let loading = $state(true);
  let error = $state("");
  let start = $state("");
  let titleInput: HTMLInputElement;
  let descriptionInput: DescriptionEditor;

  onMount(() => {
    let active = true;
    Promise.all([settingsStore.getSettings(), taskStore.getLatestStartTime(new Date())])
      .then(([settings, latestStart]) => {
        if (!active) return;
        start = dayjs(latestStart).format("HH:mm");
        if (settings.autoFocusDescription) {
          title = settings.taskCreateDefaultValue?.title ?? "";
          descriptionInput?.focus();
        } else {
          description = settings.taskCreateDefaultValue?.description ?? "";
          titleInput?.focus();
        }
      })
      .catch(() => {
        if (!active) return;
        error = "Could not load defaults.";
        titleInput?.focus();
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  async function save() {
    if (!title.trim() || saving || loading) return;
    saving = true;
    error = "";
    try {
      await taskStore.addTask({
        title: title.trim(),
        description: description.trim(),
        status: "pending",
      });
      window.close();
    } catch {
      error = "Could not save task. Please try again.";
    } finally {
      saving = false;
    }
  }
</script>

<TerminalForm
  title="new task"
  meta="alt+↑"
  double
  showBack={false}
  onCancel={() => window.close()}
  onSave={save}
  busy={saving}
>
  <label class="prompt-field"
    ><span>title</span><span class="chevron">❯</span><input
      id="task-title-input"
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
  <p class="time-preview">
    <span class="muted">time</span><span class="time">{start || "--:--"} → now</span><span
      class="muted"># last task → now</span
    >
  </p>
  {#if error}<p class="error" role="alert">! {error}</p>{/if}
  {#snippet footer(formId)}
    <span class="muted">ctrl/cmd+⏎ save</span>
    <button type="button" class="text-button push" onclick={() => window.close()}
      >[esc] close</button
    >
    <button
      type="submit"
      form={formId}
      class="save-button"
      disabled={!title.trim() || saving || loading}>{saving ? "saving…" : "save ⏎"}</button
    >
  {/snippet}
</TerminalForm>

<style>
  .prompt-field {
    display: grid;
    grid-template-columns: 6ch 1ch minmax(0, 1fr);
    gap: 1ch;
    align-items: baseline;
  }
  .prompt-field > span:first-child {
    color: var(--foreground2);
  }
  .chevron {
    color: var(--accent-text);
  }
  .prompt-field input {
    background: transparent;
    padding: 0.2lh 0.5ch;
  }
  .prompt-field input {
    font-weight: 700;
  }
  .time-preview {
    display: flex;
    gap: 2ch;
    flex-wrap: wrap;
  }
</style>
