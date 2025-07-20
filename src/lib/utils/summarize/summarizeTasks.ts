import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { SummaryProgressStatus } from '../../../types/summary';
import { clusterTitles } from './classify-title';
import { getModel } from './get-model';
import { filterWorkTasks } from './preprocess/filter-work-tasks';
import { normalizeTasks } from './preprocess/normalizer';
import { parseTaskDescription } from './preprocess/parse-task-descs';
import { ProgressTracker } from './progress-tracker';
import { removeSimilarSentences } from './remove-similiar-sentences';

// Progress message constants
const PROGRESS_MESSAGES = {
	TITLE_CLASSIFICATION: 'Classifying task titles...',
	PROCESSING_GROUPS: 'Processing classified groups...',
	COLLECTING_FOR_DEDUPLICATION: 'Collecting tasks for deduplication...',
	ANALYZING_SIMILARITIES: 'Removing duplicates tasks...',
	REBUILDING_GROUPS: 'Rebuilding task groups...',
} as const;

interface ISummaryGroup {
	title: string;
	tasks: string[];
}

interface IParsedTask {
	title: string;
	description: string;
}

type TTasksMap = Map<string, string[]>;

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

	const progressSteps = [SummaryProgressStatus.PREPROCESSING, SummaryProgressStatus.FILTERING, SummaryProgressStatus.LOADING_MODEL, SummaryProgressStatus.GROUPING, SummaryProgressStatus.REMOVING_DUPLICATES, SummaryProgressStatus.FINALIZING];

	const progressTracker = new ProgressTracker(progressSteps, onProgress);

	try {
		progressTracker.reportStepComplete(SummaryProgressStatus.LOADING_MODEL);
		// Start model loading early in background
		const model = await getModel((status) => progressTracker.updateCurrentStepProgress(status));

		const parsedTasks = await processWithProgress(() => normalizeTasks(tasks), 'Preprocessing tasks...');
		progressTracker.reportStepComplete(SummaryProgressStatus.PREPROCESSING);

		const workTasks = await processWithProgress(() => filterWorkTasks(parsedTasks), 'Filtering work tasks...');
		progressTracker.reportStepComplete(SummaryProgressStatus.FILTERING);

		const grouped = await groupTasksByTitle(workTasks, progressTracker);
		progressTracker.reportStepComplete(SummaryProgressStatus.GROUPING);

		const minimized = await removeSimilarDescriptions(grouped, model, similarityThreshold, progressTracker);
		progressTracker.reportStepComplete(SummaryProgressStatus.REMOVING_DUPLICATES);

		const result = await processWithProgress(() => formatSummaryGroups(minimized), 'Finalizing summary...');
		progressTracker.reportStepComplete(SummaryProgressStatus.FINALIZING);

		progressTracker.complete('Summary generated successfully!');
		return result;
	} catch (error) {
		console.error('Error summarizing tasks:', error);
		progressTracker.updateCurrentStepProgress('Error generating summary');
		return [];
	} finally {
		progressTracker.destroy();
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
async function groupTasksByTitle(tasks: IParsedTask[], progressTracker: ProgressTracker) {
	const groups = new Map<string, string[]>();
	const titles = tasks.map((task) => task.title);

	// Yield control before heavy computation
	await new Promise((resolve) => setTimeout(resolve, 0));

	// Step 1: Classify task titles
	progressTracker.updateCurrentStepProgress(PROGRESS_MESSAGES.TITLE_CLASSIFICATION);
	const titleClusters = await processWithProgress(() => clusterTitles(titles, (status) => progressTracker.updateCurrentStepProgress(status)), PROGRESS_MESSAGES.TITLE_CLASSIFICATION);

	// Step 2: Process each classification category
	progressTracker.updateCurrentStepProgress(PROGRESS_MESSAGES.PROCESSING_GROUPS);

	const categoryEntries = Object.entries(titleClusters).filter(([_, titles]) => titles.length > 0);
	const totalCategories = categoryEntries.length;

	for (let categoryIndex = 0; categoryIndex < categoryEntries.length; categoryIndex++) {
		const [categoryKey, categoryTitles] = categoryEntries[categoryIndex];

		// For valid_title and project_tasks categories, group each title separately
		// For other categories, group all titles under the category name
		if (categoryKey === 'valid_title' || categoryKey === 'project_tasks') {
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

		progressTracker.updateCurrentStepWithSubProgress(PROGRESS_MESSAGES.PROCESSING_GROUPS, categoryIndex, totalCategories);
	}

	return groups;
}

async function removeSimilarDescriptions(tasksMap: Map<string, string[]>, model: UniversalSentenceEncoder, threshold: number = 0.7, progressTracker: ProgressTracker) {
	const result: TTasksMap = new Map();

	// Early exit for empty or small datasets
	if (tasksMap.size === 0) return result;

	progressTracker.updateCurrentStepProgress(PROGRESS_MESSAGES.COLLECTING_FOR_DEDUPLICATION);
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

	progressTracker.updateCurrentStepProgress(PROGRESS_MESSAGES.ANALYZING_SIMILARITIES);
	await new Promise((resolve) => setTimeout(resolve, 0));

	// Batch process all tasks at once for better performance
	const allTaskStrings = allTasks.map((item) => item.task);
	const uniqueTaskStrings = await removeSimilarSentences(allTaskStrings, model, threshold);

	progressTracker.updateCurrentStepProgress(PROGRESS_MESSAGES.REBUILDING_GROUPS);
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
