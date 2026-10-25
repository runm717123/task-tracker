import { removeSimilarSentences } from "./remove-similar-sentences";
import { DEFAULT_SIMILARITY_THRESHOLD } from "./similarity";

/**
 * Removes near-duplicate fragments from every group.
 *
 * Each group is de-duplicated on its own: a fragment in one group never affects the fragments of
 * another group, so work filed under two different titles is never silently removed.
 */
export function removeSimilarDescriptions(
  tasksMap: Map<string, string[]>,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Map<string, string[]> {
  const result: Map<string, string[]> = new Map();

  for (const [title, tasks] of tasksMap) {
    if (tasks.length === 0) continue;

    const unique = removeSimilarSentences(tasks, threshold);
    if (unique.length > 0) {
      result.set(title, unique);
    }
  }

  return result;
}
