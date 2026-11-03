# Frontend maintenance

## Shared wrappers

Use `TerminalFrame.svelte` for a screen header, optional back action, content and footer. It accepts content and footer snippets; it does not own task state, persistence or navigation.

Use `TerminalForm.svelte` for editable screens. It composes the frame with a real HTML form and owns the common form shortcuts:

- Enter inside a form field requests native submission and validation.
- Shift+Enter preserves multiline editing. Composition and modified keyboard events keep their normal behavior.
- Enter on buttons, links and selects keeps native activation. It must not become a save action.
- Escape cancels unless a save is pending.
- The footer receives a generated form ID. Save buttons use `type="submit"` and `form={formId}` to submit the same form from outside its body.

Consumers own their draft values, domain validation, async save state and error messages. Pass `busy={saving}` and guard the save function against duplicate submissions. Every non-submit action should declare `type="button"`. The shared task editor lives in `lib/components/tasks/TaskForm.svelte`; settings remain owned by the popup, and quick add keeps its compact fields and automatic timing.

Avoid introducing a wrapper for every individual native control. Extract shared behavior or a repeated layout when two consumers already need it.

## Styles and theme

Each entrypoint's `main.ts` imports `lib/styles/global.css` directly so Vite emits a shared stylesheet. Keep shared CSS outside `entrypoints/` to avoid WXT building it as an extra standalone entrypoint. Global CSS declares WebTUI's layer order, imports only the required WebTUI components, and supplies common frame/control/utility styles. Entrypoint CSS sets viewport dimensions. Screen-specific layouts belong in their Svelte component styles.

The palette lives in `lib/styles/theme.css`:

| Tokens                                                 | Intended use                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| `--background0`, `--background1`                       | Main canvas and footer/deeper surfaces.                          |
| `--background2`, `--background3`, `--surface-selected` | Inputs, raised/hover surfaces and selected tasks.                |
| `--foreground0`, `--foreground1`, `--foreground2`      | Primary text, descriptions and supporting metadata.              |
| `--accent`, `--accent-text`, `--accent-foreground`     | Filled actions, text actions/headings and text on accent fills.  |
| `--info`, `--link`, `--focus`                          | Time values, links and focus indicators.                         |
| `--success`, `--warning`, `--danger`                   | Durations/success, resets/warnings and destructive/error states. |
| `--border-color`                                       | Structural borders and timeline stems.                           |

Keep the original navy/blue identity and use role colors to distinguish information. Reuse tokens instead of adding literal screen-specific colors. Check supporting text against canvas, input and selection surfaces when changing the palette. Settings helper text inherits the normal 14px size at the popup width; compact task metadata uses smaller sizes deliberately.

Use native inputs with WebTUI attributes, including `is-="checkbox"`, and WebTUI `box-` on frames. Custom attribute typing is in `types/webtui.d.ts`. Layout uses `ch` and `lh` to follow the terminal typography. Keep shared selectors deliberate: global rules can override local color roles through specificity, so combined error/hint classes need explicit handling.

## Keyboard and focus

`utils/keyboard.ts` decides when list shortcuts should be ignored: editable controls, composition, browser modifiers, prevented events and native button/link activation. Duration formatting remains in `task-display.ts`. The sidepanel handles only its explicit Ctrl+e/n/i/p commands before that guard, preventing browser defaults for those commands in the main view. List/Summary use l/s; l replaces its former next-period action. The shared task editor handles t/d/s/e field focus only when neither the event target nor the active element is an editable control. This keeps the same behavior in popup and sidepanel editors.

The sidepanel selects the last task initially and on a filter change, preserving the selected ID across ordinary storage refreshes. A task card reports selection on primary pointer press and when focus enters its controls, keeping mouse/touch and keyboard targets aligned. Cards can receive focus on their background without adding extra Tab stops; their nested buttons and links retain native behavior. It scrolls the selected task into view after rendering. Resume/delete keyboard actions confirm before changing storage and ignore held keys or an already pending keyboard action. Direct card buttons retain their immediate behavior.

The task list receives document focus when mounted, including after cancelling editing. This must not steal focus from a filter during a data refresh. Document focus does not guarantee browser pane focus: Brave may require one click inside the sidepanel before shortcuts work. Tests asserting `document.activeElement` do not prove that the browser routes real keystrokes into the panel.

## Async behavior and reuse

Use `createClipboard()` from `utils/clipboard.svelte.ts` inside components that need transient copy feedback. It shares the success/failure state, clears its timer on unmount and ignores superseded clipboard results. Preserve its reactive getters; destructuring the returned status would capture a snapshot.

Guard async mount work after unmount and unsubscribe storage listeners. Keep action availability checks inside action functions as well as disabled UI controls so shortcuts obey the same rules. When changing filters, invalidate old loads before awaiting settings or storage and discard stale task data after failure.

## Review checklist

- Put genuinely shared components in `lib/`; avoid imports between entrypoints.
- Keep storage/timing rules in stores and deterministic summary rules in the summary pipeline.
- Preserve button semantics, visible focus and native validation.
- Cover behavior regressions with focused tests that mount the actual consumer.
- Run the checks in [Development](development.md). Unused locals and parameters are checked by TypeScript.
- Update the relevant guide when behavior, keys or component contracts change.
