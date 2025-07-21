import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { ProgressReporter, type ProgressReportCallback } from '../progress-reporter/progress-reporter';
import { PROGRESS_CONFIG } from '../progress-reporter/progress-config';
import { clusterTitles } from './classify-title';
import { getModel } from './get-model';
import { filterWorkTasks } from './preprocess/filter-work-tasks';
import { normalizeTasks } from './preprocess/normalizer';
import { parseTaskDescription } from './preprocess/parse-task-descs';
import { removeSimilarSentences } from './remove-similiar-sentences';

/**
 * Parses ITrackedTask array and groups tasks by semantic similarity and title
 * Filters out non-work related tasks (breaks, personal activities)
 * @param tasks Array of tracked tasks
 * @param similarityThreshold Minimum similarity score for grouping similar titles (0-1)
 * @param onProgress Optional callback for progress updates during model loading
 * @returns Grouped summary data for display
 */
export async function summarizeTasks(tasks: ITrackedTask[], similarityThreshold: number = 0.7, onProgress?: (status: string) => void): Promise<ISummaryGroup[]> {
	if (tasks.length === 0) return [];

	const progressReporter = new ProgressReporter(PROGRESS_CONFIG);

	// Set up progress callback to convert ProgressStage to string
	if (onProgress) {
		progressReporter.onProgress((stage, stageName) => {
			console.log('🚀 ~ progressReporter.onProgress ~ stage:', stage);
			onProgress(`${stage.message} (${stage.percentage}%)`);
		});
	}

	try {
		progressReporter.report('init');

		// Start model loading early in background
		progressReporter.report('loadingEmbeddingModel');
		const model = await getModel();

		progressReporter.report('preprocess');
		const parsedTasks = await processWithProgress(() => normalizeTasks(tasks), 'Preprocessing tasks...');

		progressReporter.report('filterWorkTasks');
		const workTasks = await processWithProgress(() => filterWorkTasks(parsedTasks), 'Filtering work tasks...');

		progressReporter.report('groupingTaskTitles');
		const grouped = await groupTasksByTitle(workTasks);

		progressReporter.report('removeSimilarDescriptions');
		const minimized = await removeSimilarDescriptions(grouped, model, similarityThreshold, progressReporter, onProgress);

		progressReporter.report('finalizing');
		const result = await processWithProgress(() => formatSummaryGroups(minimized), 'Finalizing summary...');

		progressReporter.report('done');
		return result;
	} catch (error) {
		console.error('Error summarizing tasks:', error);
		if (onProgress) {
			onProgress('Error generating summary');
		}
		return [];
	}
}

/**
 * Helper function to process work with progress yielding
 */
async function processWithProgress<T>(work: () => T, _progressMessage?: string): Promise<T> {
	// Yield control before starting work
	await new Promise((resolve) => setTimeout(resolve, 0));

	const result = work();

	// Yield control after work
	await new Promise((resolve) => setTimeout(resolve, 0));

	return result;
}

/**
 * Groups tasks by their titles using ML-based classification
 */
async function groupTasksByTitle(tasks: IParsedTask[]) {
	const groups = new Map<string, string[]>();
	const titles = tasks.map((task) => task.title);

	// Yield control before heavy computation
	await new Promise((resolve) => setTimeout(resolve, 0));

	const titleClusters = await clusterTitles(titles);

	const categoryEntries = Object.entries(titleClusters).filter(([_, titles]) => titles.length > 0);
	const totalCategories = categoryEntries.length;

	for (let categoryIndex = 0; categoryIndex < categoryEntries.length; categoryIndex++) {
		const [categoryKey, categoryTitles] = categoryEntries[categoryIndex];

		// For valid_title and project_tasks categories, group each title separately
		// For other categories, group all titles under the category name
		if (categoryKey === 'valid_title') {
			// Each title gets its own group
			for (const title of categoryTitles) {
				const taskItems: string[] = [];
				const matchingTasks = tasks.filter((task) => task.title === title);

				for (const task of matchingTasks) {
					const items = parseTaskDescription(task.description);
					taskItems.push(...items);
				}

				if (taskItems.length > 0) {
					groups.set(title, taskItems);
				}
			}
		} else {
			// Group all titles under the category name
			const taskItems: string[] = [];

			for (const title of categoryTitles) {
				const matchingTasks = tasks.filter((task) => task.title === title);
				for (const task of matchingTasks) {
					const items = parseTaskDescription(task.description);
					taskItems.push(...items);
				}
			}

			if (taskItems.length > 0) {
				// Use a more readable category name
				const categoryDisplayName = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
				groups.set(categoryDisplayName, taskItems);
			}
		}

		// Yield control and update sub-progress
		await new Promise((resolve) => setTimeout(resolve, 0));
	}

	return groups;
}

async function removeSimilarDescriptions(tasksMap: Map<string, string[]>, model: UniversalSentenceEncoder, threshold: number = 0.7, progressReporter: ProgressReporter, onProgress?: (status: string) => void) {
	const result: TTasksMap = new Map();

	// Early exit for empty or small datasets
	if (tasksMap.size === 0) return result;

	await new Promise((resolve) => setTimeout(resolve, 0));

	// Collect all tasks with their group information for batch processing
	const allTasks: { task: string; groupTitle: string; originalIndex: number }[] = [];
	const groupTaskCounts = new Map<string, number>();

	for (const [title, tasks] of tasksMap) {
		if (tasks.length === 0) continue;

		// Quick deduplication by exact string match first
		const exactlyUniqueTasks = [...new Set(tasks)];
		groupTaskCounts.set(title, exactlyUniqueTasks.length);

		exactlyUniqueTasks.forEach((task, index) => {
			allTasks.push({ task, groupTitle: title, originalIndex: index });
		});
	}

	// If no tasks after deduplication, return empty result
	if (allTasks.length === 0) return result;

	await new Promise((resolve) => setTimeout(resolve, 0));

	// Batch process all tasks at once for better performance
	const allTaskStrings = allTasks.map((item) => item.task);
	const uniqueTaskStrings = await removeSimilarSentences(allTaskStrings, model, threshold);

	await new Promise((resolve) => setTimeout(resolve, 0));

	// Create a set for O(1) lookup of unique tasks
	const uniqueTaskSet = new Set(uniqueTaskStrings);

	// Rebuild the grouped structure with only unique tasks
	for (const [title, originalTasks] of tasksMap) {
		const exactlyUniqueTasks = [...new Set(originalTasks)];
		const filteredUniqueTasks = exactlyUniqueTasks.filter((task) => uniqueTaskSet.has(task));

		if (filteredUniqueTasks.length > 0) {
			result.set(title, filteredUniqueTasks);
		}
	}

	return result;
}

function formatSummaryGroups(groups: Map<string, string[]>): ISummaryGroup[] {
	const result = Array.from(groups.entries()).map(([title, tasks]) => {
		return {
			title: title || 'General Tasks',
			tasks: tasks,
		};
	});

	// Sort by title following CLASSIFIED_TITLES_KEYS ordering with project_tasks as 3rd
	const titleOrder = [
		// 'valid_title', // These are original titles that should appear first when not matching any category
		'Background Task',
		'Project Tasks', // project_tasks moved to 3rd position
		'Meetings',
		'General Tasks',
		'General Activities',
	];

	result.sort((a, b) => {
		const indexA = titleOrder.indexOf(a.title);
		const indexB = titleOrder.indexOf(b.title);

		// If both titles are in the predefined order, sort by their index
		if (indexA !== -1 && indexB !== -1) {
			return indexA - indexB;
		}

		// If only one title is in the predefined order, it comes after original titles (valid_title)
		if (indexA !== -1) return 1;
		if (indexB !== -1) return -1;

		// If neither title is in the predefined order (original titles from valid_title), sort alphabetically and appear first
		return a.title.localeCompare(b.title);
	});

	return result;
}
