<script lang="ts">
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import { settingsStore } from "../../../lib/stores/settingsStore";
  import TerminalForm from "../../../lib/components/terminal/TerminalForm.svelte";

  let { onCancel }: { onCancel: () => void } = $props();
  let settings = $state(settingsStore.getDefaultSettings());
  let loading = $state(true);
  let saving = $state(false);
  let error = $state("");
  let startTime = $state("08:00");
  let autoFocusDescription = $state(false);
  let defaultToRecentDay = $state(false);
  let title = $state("");
  let description = $state("");

  function populate(value: ISettings) {
    settings = value;
    startTime = dayjs(value.startTime).format("HH:mm");
    autoFocusDescription = value.autoFocusDescription ?? false;
    defaultToRecentDay = value.defaultToRecentDay ?? false;
    title = value.taskCreateDefaultValue?.title ?? "";
    description = value.taskCreateDefaultValue?.description ?? "";
  }
  onMount(() => {
    let active = true;
    settingsStore
      .getSettings()
      .then((value) => {
        if (active) populate(value);
      })
      .catch(() => {
        if (active) error = "Could not load settings.";
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  async function save() {
    if (loading || saving || !startTime) return;
    saving = true;
    error = "";
    try {
      const [hour, minute] = startTime.split(":").map(Number);
      await settingsStore.saveSettings({
        ...settings,
        startTime: dayjs().hour(hour).minute(minute).second(0).toISOString(),
        autoFocusDescription,
        defaultToRecentDay,
        taskCreateDefaultValue: { title, description },
      });
      onCancel();
    } catch {
      error = "Could not save settings. Please try again.";
    } finally {
      saving = false;
    }
  }
</script>

<TerminalForm
  title="settings"
  meta="~/.config/ndev"
  {onCancel}
  onSave={save}
  busy={saving}
  className="settings-screen"
  bodyClass="settings-form"
>
  {#if loading}<p class="muted">loading settings…</p>{:else}
    <div class="setting">
      <label class="setting-row"
        >work_start <input
          type="time"
          bind:value={startTime}
          required
          aria-label="Work start time"
        /></label
      >
      <p class="setting-help muted"># start time of the first task each day</p>
    </div>
    <div class="setting">
      <label class="check-row"
        ><input type="checkbox" is-="checkbox" bind:checked={autoFocusDescription} /> auto_focus_description</label
      >
      <p class="setting-help muted"># quick add puts the cursor in the description</p>
    </div>
    <div class="setting defaults-setting">
      <p>defaults <span class="setting-help muted"># prefilled task values</span></p>
      <div class="defaults-grid">
        <label class="default-row"
          ><span class="muted">title</span><input
            bind:value={title}
            placeholder="Default title"
          /></label
        >
        <label class="default-row"
          ><span class="muted">desc</span><textarea
            bind:value={description}
            rows={1}
            placeholder="~"></textarea></label
        >
      </div>
    </div>
    <div class="setting">
      <label class="check-row"
        ><input type="checkbox" is-="checkbox" bind:checked={defaultToRecentDay} /> default_to_recent_day</label
      >
      <p class="setting-help muted"># most recent day with tasks (last 30 days)</p>
    </div>
    <div class="setting-row">
      <span>shortcut</span><span class="shortcut-keys subtle"
        ><kbd>alt</kbd><span class="muted">+</span><kbd>↑</kbd></span
      >
    </div>
  {/if}
  {#if error}<p class="error" role="alert">! {error}</p>{/if}
  {#snippet footer(formId)}
    <button
      type="button"
      class="text-button reset-button"
      onclick={() => populate(settingsStore.getDefaultSettings())}
      disabled={loading || saving}>reset</button
    >
    <button type="button" class="text-button push" onclick={onCancel} disabled={saving}
      >[esc] cancel</button
    >
    <button
      type="submit"
      form={formId}
      class="save-button"
      disabled={loading || saving || !startTime}>{saving ? "saving…" : "[⏎] save"}</button
    >
  {/snippet}
</TerminalForm>

<style>
  :global(.settings-screen .frame-meta) {
    font-size: inherit;
  }
  :global(.settings-screen .save-button) {
    padding-block: 0;
  }
  :global(.settings-screen .settings-form) {
    padding-bottom: 0.5lh;
  }
  .setting {
    display: flex;
    flex-direction: column;
    gap: 0.2lh;
  }
  .setting-help {
    font-size: inherit;
    line-height: inherit;
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1ch;
  }
  .setting-row input {
    width: 13ch;
    padding-block: 0.1lh;
  }
  .check-row {
    display: flex;
    align-items: center;
    gap: 1ch;
    cursor: pointer;
  }
  .check-row input {
    width: 3ch;
    height: 1lh;
    margin: 0;
    padding: 0;
  }
  .defaults-setting,
  .defaults-grid {
    gap: 0.4lh;
  }
  .defaults-grid {
    display: grid;
  }
  .default-row {
    display: grid;
    grid-template-columns: 7ch minmax(0, 1fr);
    align-items: start;
  }
  .default-row input,
  .default-row textarea {
    height: 1lh;
    min-height: 1lh;
    padding-block: 0;
    line-height: inherit;
  }
  .default-row textarea {
    field-sizing: content;
    height: auto;
    max-height: 4lh;
  }
  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 1ch;
  }
  button.reset-button {
    color: var(--warning);
  }
  kbd {
    background: var(--background1);
    padding: 0 1ch;
  }
</style>
