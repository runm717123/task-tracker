import { normalizeTasks } from "./preprocess/normalizer";
import { groupTasksByTitle } from "./group-tasks-by-title";
import { parseGroupedTaskDescriptions } from "./parse-task-descriptions";
import { removeSimilarDescriptions } from "./remove-similar-descriptions";
import { formatSummaryGroups } from "./format-summary-groups";
import { DEFAULT_SIMILARITY_THRESHOLD } from "./similarity";

/**
 * Groups tasks by title and removes near-duplicate fragments from each group.
 *
 * The whole pipeline is deterministic: no model is loaded, no request is made, and the same input
 * always produces the same summary.
 *
 * @param tasks Array of tracked tasks
 * @param similarityThreshold Dice coefficient above which two fragments count as near-duplicates
 * @returns Grouped summary data for display
 */
export async function summarizeTasks(
  tasks: ITrackedTask[],
  similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<ISummaryGroup[]> {
  if (tasks.length === 0) return [];

  try {
    // Preprocess tasks
    const parsedTasks = normalizeTasks(tasks);

    // Group tasks by title
    const groupedTasks = groupTasksByTitle(parsedTasks);

    // Parse task descriptions into fragments
    const grouped = parseGroupedTaskDescriptions(groupedTasks);

    // Remove near-duplicate fragments, per group
    const minimized = removeSimilarDescriptions(grouped, similarityThreshold);

    // Format final results
    return formatSummaryGroups(minimized);
  } catch (error) {
    console.error("Error summarizing tasks:", error);
    return [];
  }
}
