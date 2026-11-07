<script lang="ts">
  import dayjs from "dayjs";

  let {
    value = $bindable(""),
    label,
    shortcut,
  }: {
    value?: string;
    label: string;
    shortcut?: string;
  } = $props();

  let date = $state(value.slice(0, 10));
  let time = $state(value.slice(11, 16));
  let lastValue = value;
  let dateInput: HTMLInputElement;
  let timeInput: HTMLInputElement;

  $effect(() => {
    if (value !== lastValue) {
      date = value.slice(0, 10);
      time = value.slice(11, 16);
      lastValue = value;
    }
  });

  export function focus() {
    timeInput?.focus();
  }

  function update(part: "date" | "time", next: string) {
    if (part === "date") date = next;
    else time = next;
    if (next) {
      date ||= dayjs().format("YYYY-MM-DD");
      if (part === "date") time ||= "00:00";
    }
    value = date && time ? `${date}T${time}` : "";
    lastValue = value;
  }

  function navigate(event: KeyboardEvent) {
    if (
      event.altKey &&
      event.key === "ArrowLeft" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();
      dateInput.focus();
    }
  }
</script>

<div class="field">
  <span>{label}</span>
  <div class="datetime">
    <input
      class="date"
      type="date"
      aria-label="{label} date"
      tabindex="-1"
      bind:this={dateInput}
      value={date}
      required={!!time}
      oninput={(event) => update("date", event.currentTarget.value)}
    />
    <input
      class="time"
      type="time"
      step="60"
      aria-label={label}
      title="Time; Alt+Left Arrow focuses the date"
      aria-keyshortcuts={shortcut}
      bind:this={timeInput}
      value={time}
      required={!!date}
      oninput={(event) => update("time", event.currentTarget.value)}
      onkeydown={navigate}
    />
  </div>
</div>

<style>
  .datetime {
    display: flex;
    align-items: center;
    gap: 0.25ch;
    min-width: 0;
  }
  .date {
    min-width: 0;
    flex: 1;
    width: 12ch;
  }
  .time {
    width: 11ch;
    min-width: 0;
  }
  .time::-webkit-calendar-picker-indicator {
    display: none;
  }
</style>
