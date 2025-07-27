import { tick } from 'svelte';
import { PROGRESS_CONFIG } from '../progress-reporter/progress-config';
import { ProgressReporter } from '../progress-reporter/progress-reporter';
import { getModel } from './get-model';
import { normalizeTasks } from './preprocess/normalizer';
import { parseGroupedTaskDescriptions } from './parse-task-descriptions';
import { groupTasksByTitle } from './group-tasks-by-title';
import { removeSimilarDescriptions } from './remove-similar-descriptions';
import { formatSummaryGroups } from './format-summary-groups';

/**
 * Parses ITrackedTask array and groups tasks by its title, extract, and removes similar descriptions
 * @param tasks Array of tracked tasks
 * @param similarityThreshold Minimum similarity score for grouping similar titles (0-1)
 * @param onProgress Optional callback for progress updates during model loading
 * @returns Grouped summary data for display
 */
export async function summarizeTasks(tasks: ITrackedTask[], similarityThreshold: number = 0.7, onProgress?: (status: string) => void): Promise<ISummaryGroup[]> {
	if (tasks.length === 0) return [];

	const progressReporter = createProgressReporter(onProgress);

	try {
		progressReporter.report('init');

		// Load model and preprocess tasks in parallel for better performance
		const [parsedTasks, model] = await Promise.all([preprocessTasks(tasks, progressReporter), loadModelWithProgress(progressReporter)]);

		progressReporter.report('groupingTaskTitles');
		// Group tasks by title
		const groupedTasks = await groupTasksByTitle(parsedTasks);

		progressReporter.report('parseTaskDescriptions');
		// Parse task descriptions only for tasks that are in groups
		const grouped = await parseGroupedTaskDescriptions(groupedTasks);

		progressReporter.report('removeSimilarDescriptions');
		// Remove similar descriptions
		const minimized = await removeSimilarDescriptions(grouped, model, similarityThreshold);

		progressReporter.report('finalizing');
		// Format final results
		const result = await formatSummaryGroups(minimized);

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
 * Creates and configures progress reporter
 */
function createProgressReporter(onProgress?: (status: string) => void) {
	const progressReporter = new ProgressReporter(PROGRESS_CONFIG);

	if (onProgress) {
		progressReporter.onProgress((stage) => {
			onProgress(`${stage.message} (${stage.percentage}%)`);
		});
	}

	return progressReporter;
}

/**
 * Loads the model with progress reporting
 */
async function loadModelWithProgress(progressReporter: ProgressReporter<typeof PROGRESS_CONFIG>) {
	progressReporter.report('loadingEmbeddingModel');
	await tick();
	return await getModel();
}

/**
 * Preprocesses tasks with progress reporting
 */
async function preprocessTasks(tasks: ITrackedTask[], progressReporter: ProgressReporter<typeof PROGRESS_CONFIG>) {
	progressReporter.report('preprocess');
	await tick();
	return normalizeTasks(tasks);
}
