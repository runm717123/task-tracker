# Development and verification

## Setup

Use Node.js and pnpm, then run:

```bash
pnpm install
pnpm dev
```

`pnpm dev` makes a development build; it is not a watch server. Load `.output/chrome-mv3` as an unpacked extension from the browser's extension manager with Developer mode enabled. Reload the extension after rebuilding. `pnpm exec wxt` starts live development; `pnpm dev:watch` watches source files and rebuilds through nodemon.

WXT reads `src/` as the source directory. Development builds use `public-dev/`; production builds use `public/`, selected by `WXT_ENV`. The background script handles the extension command declared in `wxt.config.ts`.

## Checks

```bash
pnpm check
pnpm exec vitest run
pnpm build:prod
```

`check` runs Svelte/TypeScript diagnostics, including unused locals/parameters. Vitest runs store and utility unit tests plus Svelte behavior tests. Production build generates `.output/chrome-mv3` and a distributable ZIP under `.output/`. `package.json` supplies the release version.

Format files you change with `pnpm exec prettier --write <paths>`. `pnpm format` formats the whole repository; use it deliberately to avoid unrelated changes. Keep dependency versions pinned and commit the pnpm lockfile with dependency changes.

## Test boundaries

UI tests use Testing Library, the Svelte Vite plugin and Happy DOM. Files that mount components declare `// @vitest-environment happy-dom`. `vitest.config.ts` disables external Svelte config discovery for these tests and uses WXT's test plugin. Import `fakeBrowser` directly from `wxt/testing/fake-browser` to keep its Node-only testing barrel out of browser-resolved component tests.

The test config also aliases the exact `wxt/testing` barrel to `wxt/testing/fake-browser`: WXT's browser mock imports that barrel internally. This keeps component tests that import `wxt/browser` from loading WXT's build tooling under browser resolution. Build configuration continues to import `WxtVitest` directly from its dedicated subpath.

Reset fake browser storage before each test and clean up mounted components and spies afterward. Prefer real stores backed by fake storage when checking selection, filtering and task actions. Existing tests cover last-task selection, confirmation cancellation/acceptance, focus restoration, failed/invalid filter handling and keyboard guards. Shared-form tests mount task editing, settings and quick add to check that Enter saves from fields while leaving button activation native.

Happy DOM does not simulate the browser's default click after Enter on a button or routing between browser panes. Tests can assert that the key is not intercepted and separately exercise the click; they cannot prove native browser focus transfer. Use a real extension session when changing those integration points.

## Focused browser checks

When a change affects layout, browser APIs or native controls, load the built extension in an isolated browser profile and verify the affected flow:

- Popup at 420 × 470, including scrolling in Settings and Help.
- Sidepanel at narrow and wider widths, including List/Summary, dates and totals.
- Task form Enter save, Shift+Enter newline, Escape cancel, and keyboard activation of Cancel/Delete/Reset.
- Resume/delete confirmation acceptance and cancellation.
- Import/export with test tasks, including a historical filter.

For Brave focus issues, distinguish list document focus (`document.activeElement`) from browser pane focus (`document.hasFocus()`). One click inside the sidepanel may be necessary. Do not use production task storage for test seeding or destructive checks.

Firefox scripts exist in `package.json`, but the current UI calls Chromium's `sidePanel` API. A successful Firefox bundle alone does not establish feature compatibility.
