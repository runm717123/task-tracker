import { parseTaskDescription } from "./preprocess/parse-task-description";

/**
 * Parses the description of every task of a group into its task fragments.
 *
 * @param groupedTasks Map of group titles to the tasks that belong to the group
 * @returns Map of group titles to the task fragments of that group
 */
export function parseGroupedTaskDescriptions(
  groupedTasks: Map<string, IParsedTask[]>
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const [groupTitle, tasks] of groupedTasks) {
    const allDescriptionItems: string[] = [];

    for (const task of tasks) {
      allDescriptionItems.push(...parseTaskDescription(task.description));
    }

    if (allDescriptionItems.length > 0) {
      result.set(groupTitle, allDescriptionItems);
    }
  }

  return result;
}
