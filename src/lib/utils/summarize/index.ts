// Main summarizer function
export { summarizeTasks } from "./summarize-tasks";

// Individual processing modules
export { groupTasksByTitle } from "./group-tasks-by-title";
export { removeSimilarDescriptions } from "./remove-similar-descriptions";
export { formatSummaryGroups } from "./format-summary-groups";
export { parseTaskDescription } from "./preprocess/parse-task-description";
export { normalizeTitle, normalizeSentence } from "./preprocess/normalizer";

// Similarity used to detect near-duplicate fragments
export { DEFAULT_SIMILARITY_THRESHOLD, fragmentSimilarity } from "./similarity";
