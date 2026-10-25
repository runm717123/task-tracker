/**
 * Groups tasks by their title.
 *
 * Two tasks belong to the same group when their titles normalize to the same string. The group is
 * headed by the title as it was first written, so the heading always looks like something the user
 * typed.
 *
 * @param tasks the parsed tasks to group
 * @returns a map of group title to the tasks that belong to the group
 */
export function groupTasksByTitle(tasks: IParsedTask[]): Map<string, IParsedTask[]> {
  const groups = new Map<string, IParsedTask[]>();
  const groupTitleByNormalizedTitle = new Map<string, string>();

  for (const task of tasks) {
    const knownGroupTitle = groupTitleByNormalizedTitle.get(task.title);

    if (knownGroupTitle === undefined) {
      groupTitleByNormalizedTitle.set(task.title, task.displayTitle);
      groups.set(task.displayTitle, [task]);
      continue;
    }

    const group = groups.get(knownGroupTitle);
    if (group) {
      group.push(task);
    }
  }

  return groups;
}
