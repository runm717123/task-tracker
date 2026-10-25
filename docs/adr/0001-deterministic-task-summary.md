# Replace ML summarization with deterministic grouping and de-duplication

The Summary tab used to embed a Universal Sentence Encoder (28 MB, fetched from tfhub.dev at
runtime) plus two custom-trained Keras heads: one to bucket titles into semantic categories, one to
judge whether a description fragment was a real task. We removed all three models and made the whole
pipeline deterministic, because the extension must work fully offline, the summary must be
reproducible run to run, and a 28 MB runtime download for a convenience feature was not worth the
dependency. Grouping is now one group per distinct normalized title; de-duplication compares
character 3-grams with the overlap coefficient and only ever looks inside a single group.

## Considered Options

- **Keep the models, swap only the similarity metric.** Rejected: the classifier and validator both
  consume USE embeddings, so USE would still have to ship and download.
- **Reproduce the semantic buckets with hand-written keyword lists.** Rejected: keyword lists are
  brittle in ways that are hard to see (`/sync/i` classifies "DataSync v2.1" as a meeting) and need
  someone to maintain them forever.
- **Group by title prefix** (the part before a `-`). Rejected for now: two different titles are two
  different groups, even when they share a prefix.
- **Use the Dice coefficient of the trigrams to detect near-duplicates.** Rejected after measuring
  it: on the `junior` mock data it merged 203 pairs of fragments, and nearly all of them were
  distinct work that merely shared a template, such as "Implement user role management" and
  "Implement user settings management". The overlap coefficient of the same trigrams merges 7
  pairs, and keeps the pairs that really repeat the same work, such as "Fix issue with import data
  functionality" and "Fix issue with data import functionality".

## Consequences

- We lose semantic near-duplicate detection. Of the near-duplicate pairs the embedding model caught
  on our mock data, 17/18 (`tasks.ts`), 45/72 (`junior`) and 36/38 (`senior`) share no wording, so
  no lexical metric sees them.
- In exchange we stop deleting unrelated work. Global de-duplication was removing fragments across
  groups on similarity alone: "Improve performance of user dashboard queries" was dropped because
  "Test migration scripts in staging environment" scored 0.754. De-duplication is now scoped to a
  single group, so one group's items can never affect another group's items.
- The threshold is a tuning constant, not a user-facing setting. It does not share the embedding
  model's scale: the overlap coefficient of two trigram sets is compared against 0.9, which means
  "the shorter fragment says almost exactly what the longer one says".
- Fragments that only share a template but differ in one word, such as "Implement export data
  feature" and "Implement import data feature", are still merged. No lexical method can tell those
  apart.
