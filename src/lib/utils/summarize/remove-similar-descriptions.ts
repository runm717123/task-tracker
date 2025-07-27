import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { tick } from 'svelte';
import { removeSimilarSentences } from './remove-similiar-sentences';

/**
 * Removes similar descriptions from grouped tasks using semantic similarity
 */
export async function removeSimilarDescriptions(tasksMap: Map<string, string[]>, model: UniversalSentenceEncoder, threshold: number = 0.7): Promise<TTasksMap> {
	const result: TTasksMap = new Map();

	// Early exit for empty datasets
	if (tasksMap.size === 0) return result;

	await tick();

	// Collect all tasks with their group information for batch processing
	const allTasks = collectAllTasksWithGroups(tasksMap);

	// If no tasks after deduplication, return empty result
	if (allTasks.length === 0) return result;

	await tick();

	// Batch process all tasks at once for better performance
	const allTaskStrings = allTasks.map((item) => item.task);
	const uniqueTaskStrings = await removeSimilarSentences(allTaskStrings, model, threshold);

	await tick();

	// Rebuild the grouped structure with only unique tasks
	return rebuildGroupedStructure(tasksMap, uniqueTaskStrings);
}

/**
 * Collects all tasks with their group information for batch processing
 */
function collectAllTasksWithGroups(tasksMap: Map<string, string[]>) {
	const allTasks: { task: string; groupTitle: string; originalIndex: number }[] = [];

	for (const [title, tasks] of tasksMap) {
		if (tasks.length === 0) continue;

		// Quick deduplication by exact string match first
		const exactlyUniqueTasks = [...new Set(tasks)];

		exactlyUniqueTasks.forEach((task, index) => {
			allTasks.push({ task, groupTitle: title, originalIndex: index });
		});
	}

	return allTasks;
}

/**
 * Rebuilds the grouped structure with only unique tasks
 */
function rebuildGroupedStructure(originalTasksMap: Map<string, string[]>, uniqueTaskStrings: string[]): TTasksMap {
	const result: TTasksMap = new Map();
	const uniqueTaskSet = new Set(uniqueTaskStrings);

	for (const [title, originalTasks] of originalTasksMap) {
		const exactlyUniqueTasks = [...new Set(originalTasks)];
		const filteredUniqueTasks = exactlyUniqueTasks.filter((task) => uniqueTaskSet.has(task));

		if (filteredUniqueTasks.length > 0) {
			result.set(title, filteredUniqueTasks);
		}
	}

	return result;
}
