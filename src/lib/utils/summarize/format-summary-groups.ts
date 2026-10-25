/**
 * Formats grouped tasks into summary groups with proper ordering
 */
export function formatSummaryGroups(groups: Map<string, string[]>): ISummaryGroup[] {
  return [...groups.entries()]
    .map(([title, tasks]) => ({
      title: title || "General Tasks",
      tasks,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
