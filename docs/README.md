# Task Tracker documentation

Task Tracker is a local browser extension for recording tasks and reviewing them as a list or a deterministic summary. Its three UI entrypoints share Svelte components and the WebTUI theme.

- [User guide](user-guide.md): task timing, views, settings, shortcuts, import and export.
- [Architecture](architecture.md): entrypoints, shared components, storage and summary pipeline.
- [Frontend maintenance](frontend-maintenance.md): wrappers, theme tokens, keyboard behavior and change guidelines.
- [Development](development.md): setup, checks, builds and browser verification.
- [Bundle size analysis](bundle-size-analysis.md): measured asset and dependency reductions.
- [Domain glossary](../GLOSSARY.md): the vocabulary used in code and documentation.
- [Summary decision](adr/0001-deterministic-task-summary.md): why summaries use offline grouping and de-duplication.

Repository agent workflows are documented separately in [agents/](agents/).
