---
applyTo: '**'
---
Response Format, Code Structure, Coding Standards and Preferences that AI should follow

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
- the @bios-ui/core theme already match tailwindcss, so var(--spacing-xs) is equivalent to `0.25rem`
