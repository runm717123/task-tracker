---
applyTo: '**'
---
Response Format, Code Structure, Coding Standards and Preferences that AI should follow

# Code Structure
This is a chrome extension app, this will have 3 main sections:
- the `src/entrypoints/popup` folder contains the code for the extension popup UI
- the `src/entrypoints/sidepanel` folder contains the code for the extension sidepanel UI
- the `src/entrypoints/task-popup` folder contains the code for the custom task popup UI
- use `src/lib/components` for components
- use `src/lib/utils` for utility functions
- use `src/types` for TypeScript types
- use `src/mocks` for mock data used for development

# Response Format
- no need to include description, summary, or any additional text
- just display the code snippet, and display description only when asked
- don't run pnpm dev commands
- ignore the unit test until I explicitly ask for it

---
applyTo: "**/*.svelte"
---
# Coding Standards and Preferences for Svelte

## Coding Standards and Preferences
- use latest svelte v5 syntax
- use tailwindcss for styling
- use component from @bios-ui/svelte if available
- the @bios-ui/core theme already match tailwindcss, so var(--spacing-xs) is equivalent to `0.25rem`
- the tailwind already has theme setup, refer to to @bios-ui/core/tw for the theme setup
- use the theme for colors, spacing, and other design tokens
