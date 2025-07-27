import { tick } from 'svelte';
import { CLASSIFIED_TITLE_KEYS_DICT, clusterTitles } from './classify-title';

/**
 * Groups tasks by their titles using ML-based classification
 * Returns a map of group names to the tasks that belong to each group
 */
export async function groupTasksByTitle(tasks: IParsedTask[]): Promise<Map<string, IParsedTask[]>> {
	const groups = new Map<string, IParsedTask[]>();
	const titles = tasks.map((task) => task.title);

	await tick();

	const titleClusters = await clusterTitles(titles);
	const categoryEntries = Object.entries(titleClusters).filter(([_, titles]) => titles.length > 0);

	for (let categoryIndex = 0; categoryIndex < categoryEntries.length; categoryIndex++) {
		const [categoryKey, categoryTitles] = categoryEntries[categoryIndex];

		// For valid_title and project_tasks categories, group each title separately
		// For other categories, group all titles under the category name
		if (categoryKey === 'valid_title') {
			await groupValidTitles(categoryTitles, tasks, groups);
		} else {
			await groupCategoryTitles(categoryKey, categoryTitles, tasks, groups);
		}

		await tick();
	}

	return groups;
}

/**
 * Groups tasks with valid titles individually
 */
async function groupValidTitles(categoryTitles: string[], tasks: IParsedTask[], groups: Map<string, IParsedTask[]>): Promise<void> {
	for (const title of categoryTitles) {
		const matchingTasks = tasks.filter((task) => task.title === title);

		if (matchingTasks.length > 0) {
			groups.set(title, matchingTasks);
		}
	}
}

/**
 * Groups tasks under a category name
 */
async function groupCategoryTitles(categoryKey: string, categoryTitles: string[], tasks: IParsedTask[], groups: Map<string, IParsedTask[]>): Promise<void> {
	const allMatchingTasks: IParsedTask[] = [];

	for (const title of categoryTitles) {
		const matchingTasks = tasks.filter((task) => task.title === title);
		allMatchingTasks.push(...matchingTasks);
	}

	if (allMatchingTasks.length > 0) {
		groups.set(CLASSIFIED_TITLE_KEYS_DICT[categoryKey as keyof typeof CLASSIFIED_TITLE_KEYS_DICT], allMatchingTasks);
	}
}
