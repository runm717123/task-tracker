# User guide

## Record and edit tasks

Open the extension popup to see today's tasks. Open quick add with `Alt+Up` (`Command+Up` on macOS), or use New in a task list. Enter a title and optionally a task description, then save. Quick add records the time from the latest task end, or the configured work start for the first task, through the current time.

Use a project name as the title and write task fragments as a bullet list or a comma-separated list. Keep one list style per description. For example:

```text
Task Tracker
- Fix settings layout
- Review keyboard navigation
```

Edit a task to change its title, description or start/end times. Dates and times use your browser's native controls. A supplied end must be later than the start. Saving timing changes can adjust neighboring tasks to keep the day's ranges aligned. A new task created in the sidepanel starts after the latest task for the chosen day; if its end is blank, it receives a 30-minute duration.

## Sidepanel and summaries

Open the sidepanel from the popup footer. The top controls switch between List and Summary; the separate time-range selector offers daily, weekly, monthly, custom range and all time. Previous/next controls move by the selected period.

The highlighted task is the current keyboard selection. The last task is selected on opening or changing a filter. Click a task to select it, then press `e` to edit or use another task shortcut. Moving keyboard focus to a task's controls also selects it. Use arrow keys or `j`/`k` to move the selection. A storage refresh preserves the selected task when possible.

Click a task title, description or time to copy it. Resume creates a new task for today using the selected task's title and description. Keyboard resume/delete ask for confirmation; direct task action buttons act immediately. Clear asks first and removes only the tasks shown for the current filter.

Summary groups combine tasks with the same normalized title and remove near-duplicate fragments within each group. They use your own wording and work offline. Copy a group, one fragment, or the complete summary. Task duration totals come from recorded time, independently of fragment de-duplication.

## Settings

Open Settings from the popup:

| Setting                  | Behavior                                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `work_start`             | Start time used for the first automatically timed task of a day.                                                                                                                              |
| `auto_focus_description` | Focuses the description at the end when creating or editing a task. When off, focuses the title. Creation prefills the configured default title when on, or the default description when off. |
| `defaults`               | Title/description values used according to the focus preference above.                                                                                                                        |
| `default_to_recent_day`  | Uses the most recent day containing tasks within the last 30 days when opening the daily sidepanel view.                                                                                      |
| Reset                    | Resets the settings draft; Save persists it.                                                                                                                                                  |

The global shortcut can be changed in your browser's extension-shortcut settings.

## Keyboard reference

| Context                       | Key                           | Action                                       |
| ----------------------------- | ----------------------------- | -------------------------------------------- |
| Browser                       | `Alt+Up` / macOS `Command+Up` | Open quick add.                              |
| Task list                     | `j` / `k`, Down / Up          | Select next / previous task.                 |
| Task list                     | `e` / Enter                   | Edit selected task.                          |
| Task list                     | `d`                           | Delete selected task; confirms in sidepanel. |
| Sidepanel list                | `r`                           | Resume selected task; confirms first.        |
| Task list                     | `n`                           | Create a task.                               |
| Popup list                    | `s` / `?`                     | Open Settings / Help.                        |
| Sidepanel                     | `h`                           | Previous period.                             |
| Sidepanel                     | `l` / `s`                     | Select List / Summary.                       |
| Sidepanel                     | `Ctrl+e`                      | Export displayed tasks.                      |
| Sidepanel                     | `Ctrl+n`                      | Create a task.                               |
| Sidepanel                     | `Ctrl+i`                      | Open the import file chooser.                |
| Sidepanel                     | `Ctrl+p`                      | Focus the time-range selector.               |
| Task editor, no field focused | `s` / `e`                     | Focus start / end.                           |
| Sidepanel                     | `w`                           | Toggle daily / weekly.                       |
| Sidepanel                     | `v`                           | Toggle list / summary.                       |
| Sidepanel                     | `y` / `x`                     | Copy summary / export JSON.                  |
| Form field                    | Enter / Shift+Enter           | Save / insert a description newline.         |
| Form                          | Escape                        | Cancel editing.                              |
| Popup Settings/Help           | Escape                        | Return to the list.                          |
| Main popup/sidepanel          | Escape                        | Close the popup/sidepanel.                   |

Unmodified list shortcuts do not run while typing into controls. The sidepanel Ctrl shortcuts work from its main view, including from filters, and stay inactive while editing a task. Editor field-focus shortcuts run only when no input, textarea, select or editable content has focus. `l` now selects List; use the next-period button to advance the period. Focused buttons keep their normal Enter and Space behavior. Brave may keep keyboard focus outside the sidepanel when it opens; click once inside the sidepanel to activate its shortcuts.

## Backup and restore

Export downloads the selected filter's tasks as JSON. Choose All time to back up all tasks. Import accepts a task JSON array, validates required task fields and adds tasks whose IDs are not already stored. Import does not overwrite existing IDs. Settings are not included in task exports.

Tasks and settings stay in the extension's local browser storage. Keep an export before removing the extension or clearing its data.

Task start and end use a date field and a combined native time field. Tab skips dates and enters the time fields; the browser controls navigation between time segments and their display format. Click a date to edit it, or press Alt+Left Arrow from its time field. The `s` and `e` editor shortcuts focus the corresponding time. Entering a time without a date uses today; leave both fields empty for automatic task timing.

In the popup task list, press Tab twice within 300 ms to focus the Sidepanel button, then Enter to open it. Single Tab and Shift+Tab keep their normal navigation.
