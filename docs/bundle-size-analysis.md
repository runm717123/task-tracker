# Bundle size analysis

Measured on 2026-11-04 for app version `0.7.0`, using the installed WXT
0.20.11, Vite 6.3.5 and Svelte 5.39.11. The baseline is commit `016cbd3`.
Sizes use decimal kB (1,000 bytes).

## Result

The four changes below reduce the production extension from **1,111.1 kB to
627.6 kB unpacked (43.5%)**, and from **657.6 kB to 280.8 kB zipped (57.3%)**.
Tiptap, both font weights and every existing font language subset are retained.
Task forms continue to load eagerly.

| Sequential change                         | Unpacked extension | Official WXT ZIP |
| ----------------------------------------- | -----------------: | ---------------: |
| Baseline                                  |         1,111.1 kB |         657.6 kB |
| Share CSS and deduplicate fonts           |           801.2 kB |         412.9 kB |
| Use WOFF2 without WOFF fallbacks          |           683.4 kB |         296.6 kB |
| Import specific Tiptap extensions         |           652.5 kB |         287.0 kB |
| Exclude mock tasks from production builds |           627.6 kB |         280.8 kB |

Total JavaScript falls from 535.9 kB to 480.1 kB. These package-size
measurements do not establish a particular startup-time improvement.

## Shared styles and duplicate assets

The original `src/entrypoints/global.css` was both imported by the page
stylesheets and automatically discovered as a standalone WXT entrypoint.
That extra build emitted an unused `assets/global.css` and a second set of
font files. SHA-256 comparisons confirmed 18 pairs of identical font assets.

The shared stylesheet now lives in `src/lib/styles/global.css`. Each page's
`main.ts` imports it directly, allowing Vite to extract common styles once.
The individual `app.css` files contain only viewport-specific styles. Moving
and sharing the stylesheet saves **309.9 kB unpacked**.

This follows [WXT's entrypoint guidance](https://wxt.dev/guide/essentials/entrypoints#including-other-files):
files placed directly under `entrypoints/` are treated as build inputs.
The installed WXT implementation and emitted assets confirmed the behavior.

## WOFF2 fonts

`src/lib/styles/fonts.css` references only local WOFF2 files from the pinned
`@fontsource/jetbrains-mono` package. All 12 font faces preserve their original
Unicode ranges, 400/700 weights and font-display behavior. Removing WOFF
fallbacks saves another **117.8 kB unpacked**, including inline font data in CSS.

All language subsets remain available for user-entered task text. Unicode
ranges let the browser load the subsets it needs, although every emitted
font file still contributes to the extension package.
[Fontsource subset documentation](https://fontsource.org/docs/getting-started/subsets).

When upgrading Fontsource, keep the local face declarations aligned with the
package's Unicode ranges and filenames.

## Specific Tiptap imports

`DescriptionEditor.svelte` imports the existing bullet-list, list-item,
list-keymap and undo-redo package subpaths. With the installed Tiptap version,
these avoid unused extension initialization and associated dependencies that
survived bundling through the broad package entrypoints.

The editor keeps the same configured extensions. This change saves **30.9 kB
of minified JavaScript**.

## Production mock-data exclusion

The mock fixtures and `TaskStore.initializeStorage()` remain in the codebase.
A compile-time environment guard makes initialization a no-op in production
builds, allowing the bundler to remove the otherwise-unused fixture import.
No dynamic fixture chunk is emitted.

Live development and tests can still seed empty storage. `WXT_ENV=dev` also
retains seeding in `pnpm dev`, which uses `wxt build` and therefore otherwise
has production-mode flags. Ordinary release builds exclude the data.

This change saves **24.9 kB of minified JavaScript**. Tests cover production
initialization leaving storage untouched and development builds retaining
fixture initialization. Every mock task title was confirmed absent from all
production JavaScript chunks and present in the development build.

## Verification

- `pnpm check`: no errors or warnings.
- `pnpm exec vitest run`: all 147 tests pass.
- `pnpm build:prod`: successful after every step; ZIP sizes above use WXT's
  actual distributables.
- `pnpm dev`: successful; confirms development builds retain fixture data.
- Output checks confirm no duplicate emitted font files, no standalone
  global CSS entrypoint, and no WOFF fallbacks.
- Compared all 12 local font face declarations against the pinned Fontsource
  definitions for weights, Unicode ranges and WOFF2 sources.
- Isolated Chrome checks passed on the popup, sidepanel and quick-add window:
  theme colors, typography, WOFF2 resource loading and viewport overflow.
  Bullet editing, keyboard undo/redo and saving Markdown also passed, with no
  page errors. Test tasks were seeded only in a temporary browser profile.

Local audit data and the production build snapshot are under
`.output/bundle-audit/`, which is ignored by Git.
