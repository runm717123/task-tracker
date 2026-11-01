<script lang="ts">
  import TerminalFrame from "../../../lib/components/terminal/TerminalFrame.svelte";
  let { onCancel }: { onCancel: () => void } = $props();
</script>

<TerminalFrame title="help" meta=":help task-tracker" onBack={onCancel}>
  <div class="frame-body">
    <section>
      <h2>## getting started</h2>
      <p>
        Record the work you’ve done. Use <kbd>Alt+↑</kbd> to add a task from anywhere, or press
        <kbd>n</kbd> in a task list.
      </p>
      <p class="muted">
        # customize the global shortcut at <a
          href="chrome://extensions/shortcuts"
          target="_blank"
          rel="noreferrer">extension shortcuts</a
        >
      </p>
    </section>
    <section>
      <h2>## navigation</h2>
      <dl>
        <dt>j / k</dt>
        <dd>select next / previous task</dd>
        <dt>e / Enter</dt>
        <dd>edit selected task</dd>
        <dt>d</dt>
        <dd>delete selected task (asks first in sidepanel)</dd>
        <dt>r</dt>
        <dd>resume selected task (sidepanel, asks first)</dd>
        <dt>n</dt>
        <dd>new task</dd>
        <dt>h</dt>
        <dd>previous period (sidepanel)</dd>
        <dt>l / s</dt>
        <dd>select list / summary (sidepanel)</dd>
        <dt>w</dt>
        <dd>weekly / daily (sidepanel)</dd>
        <dt>v</dt>
        <dd>list / summary (sidepanel)</dd>
        <dt>y / x</dt>
        <dd>copy summary / export (sidepanel)</dd>
        <dt>Ctrl+e</dt>
        <dd>export tasks (sidepanel)</dd>
        <dt>Ctrl+n</dt>
        <dd>new task (sidepanel)</dd>
        <dt>Ctrl+i</dt>
        <dd>import tasks (sidepanel)</dd>
        <dt>Ctrl+p</dt>
        <dd>focus time-range selector (sidepanel)</dd>
        <dt>s / ?</dt>
        <dd>settings / help (popup)</dd>
        <dt>Esc</dt>
        <dd>back / cancel / close popup or sidepanel</dd>
      </dl>
    </section>
    <section>
      <h2>## writing tasks</h2>
      <p>
        Use a project name as the title. List task fragments in the description using a bullet list
        or a comma-separated list.
      </p>
      <pre>MyProject v1
- Implement authentication
- Add responsive styles
- Review database migration</pre>
      <p class="muted"># Enter saves task forms; Shift+Enter adds a line</p>
      <p>
        In the task editor, when no field is focused: <kbd>t</kbd> focuses title,
        <kbd>d</kbd> description, <kbd>s</kbd> start, and <kbd>e</kbd> end.
      </p>
    </section>
    <section>
      <h2>## sidepanel</h2>
      <p>
        Browse by day, week, month, custom range, or all time. Click task content to copy it. Resume
        a task with <kbd>r</kbd> beside it. Import and export your tasks as JSON.
      </p>
    </section>
    <section>
      <h2>## summaries</h2>
      <p>
        Summary groups share a normalized title. Near-duplicate fragments are removed within each
        group. Every line uses your own wording, and summaries work offline.
      </p>
    </section>
  </div>
  {#snippet footer()}<span class="mode">HELP</span><button
      type="button"
      class="text-button push"
      onclick={onCancel}>[esc] back</button
    >{/snippet}
</TerminalFrame>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 0.4lh;
  }
  h2 {
    font: inherit;
    color: var(--accent-text);
    font-weight: 700;
  }
  p,
  dl {
    font-size: 12px;
    color: var(--foreground1);
  }
  dl {
    display: grid;
    grid-template-columns: 10ch 1fr;
    gap: 0.2lh 1ch;
  }
  dt,
  kbd {
    color: var(--accent-text);
  }
  pre {
    font: inherit;
    font-size: 11px;
    color: var(--foreground1);
    background: var(--background1);
    padding: 0.5lh 1ch;
    white-space: pre-wrap;
  }
</style>
