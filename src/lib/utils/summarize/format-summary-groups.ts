/**
 * Formats grouped tasks into summary groups with proper ordering
 */
export async function formatSummaryGroups(groups: Map<string, string[]>): Promise<ISummaryGroup[]> {
	const result = Array.from(groups.entries()).map(([title, tasks]) => ({
		title: title || 'General Tasks',
		tasks: tasks,
	}));

	// Sort by title following predefined ordering
	return sortSummaryGroups(result);
}

/**
 * Sorts summary groups according to predefined title order
 */
function sortSummaryGroups(groups: ISummaryGroup[]): ISummaryGroup[] {
	const titleOrder = [
		'Background Task',
		'Project Tasks',
		'Meetings',
		'General Tasks',
		'General Activities',
	];

	return groups.sort((a, b) => {
		const indexA = titleOrder.indexOf(a.title);
		const indexB = titleOrder.indexOf(b.title);

		// If both titles are in the predefined order, sort by their index
		if (indexA !== -1 && indexB !== -1) {
			return indexA - indexB;
		}

		// If only one title is in the predefined order, it comes after original titles
		if (indexA !== -1) return 1;
		if (indexB !== -1) return -1;

		// If neither title is in the predefined order, sort alphabetically and appear first
		return a.title.localeCompare(b.title);
	});
}
