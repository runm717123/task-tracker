import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { getModel } from './get-model';
import { filterWorkTasks } from './preprocess/filter-work-tasks';
import { normalizeTasks } from './preprocess/normalizer';
import { clusterTexts } from './cluster-text';
import { removeSimilarSentences } from './remove-similiar-sentences';
import { parseTaskDescription } from './preprocess/parse-task-descs';
import { onlyDifferInNumber } from './checker';
import { SummaryProgressStatus } from '../../../types/summary';
import { ProgressTracker } from './progress-tracker';

interface ISummaryGroup {
	title: string;
	tasks: string[];
}

interface IParsedTask {
	title: string;
	description: string;
}

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
		// Start model loading early in background
		const modelPromise = getModel(onProgress);

		const parsedTasks = await processWithProgress(() => normalizeTasks(tasks), 'Preprocessing tasks...');
		progressTracker.reportStepComplete(SummaryProgressStatus.PREPROCESSING);

		const workTasks = await processWithProgress(() => filterWorkTasks(parsedTasks), 'Filtering work tasks...');
		progressTracker.reportStepComplete(SummaryProgressStatus.FILTERING);

		// Wait for model to be ready
		const model = await modelPromise;
		progressTracker.reportStepComplete(SummaryProgressStatus.LOADING_MODEL);

		const grouped = await groupTasksByTitle(workTasks, model, 0.9, (subStatus) => {
			progressTracker.updateCurrentStepProgress(subStatus);
		});
		progressTracker.reportStepComplete(SummaryProgressStatus.GROUPING);

		const minimized = await removeSimilarDescriptions(grouped, model, similarityThreshold, (subStatus) => {
			progressTracker.updateCurrentStepProgress(subStatus);
		});
		progressTracker.reportStepComplete(SummaryProgressStatus.REMOVING_DUPLICATES);

		const result = await processWithProgress(() => formatSummaryGroups(minimized), 'Finalizing summary...');
		progressTracker.reportStepComplete(SummaryProgressStatus.FINALIZING);

		progressTracker.complete('Summary generated successfully!');
		return result;
	} catch (error) {
		console.error('Error summarizing tasks:', error);
		onProgress?.('Error generating summary');
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
 * Groups tasks by their titles, merging similar titles
 */
async function groupTasksByTitle(tasks: IParsedTask[], model: UniversalSentenceEncoder, threshold: number = 0.7, onProgress?: (status: string) => void) {
	const groups = new Map<string, string[]>();
	let titles = tasks.map((task) => task.title);

	// Yield control before heavy computation
	await new Promise((resolve) => setTimeout(resolve, 0));

	onProgress?.('Analyzing title patterns...');
	const [numericGroups, otherTitles] = await processWithProgress(() => splitByOnlyDifferInNumber(titles), 'Analyzing title patterns...');

	onProgress?.('Clustering similar titles...');
	const clusteredTasks = await clusterTexts(otherTitles, model, threshold);
	const combinedClusters = [...numericGroups.map((title) => [title]), ...clusteredTasks];

	onProgress?.('Processing task groups...');

	// Process clusters in chunks to maintain responsiveness
	const chunkSize = Math.max(1, Math.floor(combinedClusters.length / 10));

	for (let i = 0; i < combinedClusters.length; i += chunkSize) {
		const chunk = combinedClusters.slice(i, i + chunkSize);

		for (const cluster of chunk) {
			if (cluster.length === 0) continue;

			// Use the first title as representative
			const representativeTitle = cluster[0];
			const taskItems: string[] = [];

			for (const title of cluster) {
				const matchingTasks = tasks.filter((task) => task.title === title);
				for (const task of matchingTasks) {
					const items = parseTaskDescription(task.description);
					taskItems.push(...items);
				}
			}

			if (taskItems.length > 0) {
				groups.set(representativeTitle, taskItems);
			}
		}

		// Yield control after processing each chunk
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Update progress
		const progress = Math.round(((i + chunkSize) / combinedClusters.length) * 100);
		onProgress?.(`Processing task groups... ${Math.min(progress, 100)}%`);
	}

	return groups;
}

async function removeSimilarDescriptions(tasksMap: Map<string, string[]>, model: UniversalSentenceEncoder, threshold: number = 0.7, onProgress?: (status: string) => void) {
	const result: TTasksMap = new Map();

	// Early exit for empty or small datasets
	if (tasksMap.size === 0) return result;

	onProgress?.('Collecting tasks for deduplication...');
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

	onProgress?.('Analyzing semantic similarities...');
	await new Promise((resolve) => setTimeout(resolve, 0));

	// Batch process all tasks at once for better performance
	const allTaskStrings = allTasks.map((item) => item.task);
	const uniqueTaskStrings = await removeSimilarSentences(allTaskStrings, model, threshold);

	onProgress?.('Rebuilding task groups...');
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

	// Sort by title for consistent output
	result.sort((a, b) => {
		// Put "General Tasks" at the end
		if (a.title === 'General Tasks') return 1;
		if (b.title === 'General Tasks') return -1;
		return a.title.localeCompare(b.title);
	});

	return result;
}

// this function splits strings into 2 groups:
// 1. strings that only differ in numbers (e.g. "Project A Sprint 10" and "Project A Sprint 11")
// 2. the otherwise
function splitByOnlyDifferInNumber(strings: string[]): [string[], string[]] {
	const numericGroup: Set<string> = new Set();
	const others: string[] = [];

	for (let i = 0; i < strings.length; i++) {
		for (let j = i + 1; j < strings.length; j++) {
			if (onlyDifferInNumber(strings[i], strings[j])) {
				numericGroup.add(strings[i]);
				numericGroup.add(strings[j]);
			}
		}
	}

	for (const str of strings) {
		if (!numericGroup.has(str)) {
			others.push(str);
		}
	}

	return [[...numericGroup], others];
}
