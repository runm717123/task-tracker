# NDev Task Tracker

[![WXT](https://img.shields.io/badge/WXT-Framework-blue)](https://wxt.dev/)
[![WebTUI](https://img.shields.io/badge/UI-WebTUI-1e82dd)](https://webtui.ironclad.sh/)

A Chrome extension for task tracking built with WXT, Svelte 5, and [WebTUI](https://webtui.ironclad.sh/start/installation/). The terminal UI uses the original navy-and-blue Task Tracker palette and bundled JetBrains Mono fonts, with no runtime network requests.

**Published on Chrome Web Store:** https://chromewebstore.google.com/detail/ndev-task-tracker/occmebddclnpjgckigmgkahbckfmmpml

## Documentation

See [docs/README.md](docs/README.md) for the user guide, architecture, frontend maintenance conventions, and development checks.

## Development

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the development extension:

   ```bash
   pnpm dev
   ```

   Run `pnpm exec wxt` for live development with automatic extension reloads.

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `/.output/chrome-mv3` folder from your project directory

### Development Workflow

- `pnpm dev` creates a development build; `pnpm exec wxt` serves live development builds
- After any changes, you may need to click the "Reload" button for your extension in `chrome://extensions/`
- The extension will be available in your browser toolbar

## Production Build

To prepare a production release:

1. **Update the version** in `package.json`:

   ```json
   {
     "version": "x.x.x"
   }
   ```

2. **Build for production:**

   ```bash
   pnpm build:prod
   ```

   This command will:
   - Build the extension in production mode
   - Create a zip file ready for Chrome Web Store submission
   - Output will be in the `/.output` directory

## Project Structure

This Chrome extension has 3 main UI sections:

- **`src/entrypoints/popup/`** - Extension popup UI (when clicking the extension icon)
- **`src/entrypoints/sidepanel/`** - Extension sidepanel UI
- **`src/entrypoints/new-task-form-popup/`** - Custom task popup UI for new task form

### Folder Structure

- **`src/lib/components/`** - Reusable Svelte components
- **`src/lib/utils/`** - Utility functions
- **`src/types/`** - TypeScript type definitions
- **`src/mocks/`** - Mock data for development
- **`__tests__/`** - Unit tests (placed at same level as tested files)

## Available Scripts

- `pnpm dev` - Build the development extension
- `pnpm exec wxt` - Start the live development server
- `pnpm check` - Run Svelte and TypeScript checks
- `pnpm build:prod` - Build and zip for production
- `pnpm exec vitest run` - Run unit tests once
- `pnpm test` - Watch unit tests
- `pnpm test:ui` - Run tests with UI

## Terminal UI

All three entrypoints import `src/entrypoints/global.css`. WebTUI layers are declared before importing the base, box utility, and individual component styles. The shared palette in `src/lib/styles/theme.css` keeps the original navy (`#000b25`), darker navy (`#000b1a`), and brand blue (`#1e82dd`). Raised surfaces and selected rows use distinct blue depths; primary text, descriptions, and metadata have three contrast levels. Light blue identifies time, teal identifies links, green identifies durations and success, amber identifies reset/warnings, and coral identifies destructive actions/errors. Shared frames and status bars live in `src/lib/components/terminal/`; controls use native HTML elements and WebTUI attributes.

The popup matches the 420 × 470 layout in `design-reference.html`. The sidepanel fills its available width and height; dates and times use native browser controls. No data migration is required: task and settings storage keys and JSON import/export stay compatible.

| Key                     | Action                                            |
| ----------------------- | ------------------------------------------------- |
| `j` / `k`, arrow keys   | Select a task                                     |
| `e` / `Enter`           | Edit selected task                                |
| `d`                     | Delete selected task (asks first in sidepanel)    |
| `r`                     | Resume selected task (sidepanel; asks first)      |
| `n`                     | New task                                          |
| `s` / `?`               | Settings / help in popup                          |
| `h`                     | Previous sidepanel period                         |
| `l` / `s`               | Select list / summary in sidepanel                |
| `Ctrl+e` / `Ctrl+n`     | Export / new task in sidepanel                    |
| `Ctrl+i` / `Ctrl+p`     | Import / focus time-range selector in sidepanel   |
| `t` / `d` / `s` / `e`   | Focus title / description / start / end in editor |
| `w`                     | Toggle daily / weekly                             |
| `v`                     | Toggle list / summary                             |
| `y` / `x`               | Copy summary / export JSON                        |
| `Enter` / `Shift+Enter` | Save task form / insert description newline       |
| `Esc`                   | Cancel form / return / close popup or sidebar     |

The sidepanel prepares document focus on the task list and initially selects and reveals the last task. Browser focus is separate: Brave may keep keyboard focus outside the sidepanel, requiring one click inside it before shortcuts work. The extension does not force browser focus or capture keys from the webpage. Escape cancels a task form and restores list focus; from the main sidepanel view it closes the sidepanel. Use `j` / `k` to move the selection; `r` and `d` ask for confirmation before resuming or deleting it. All actions also have clickable controls. `Alt+Up` (`Command+Up` on macOS) opens quick add from anywhere.

Editor field-focus shortcuts apply only when no input, textarea, select or editable content has focus. In the sidepanel, `l` now selects List instead of advancing the period; the next-period button remains available. All other existing shortcuts remain supported.
