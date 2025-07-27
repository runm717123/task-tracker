import type { ProgressConfig } from './progress-reporter';

export const PROGRESS_CONFIG = {
	init: {
		message: 'initializing',
		percentage: 0,
	},
	loadingEmbeddingModel: {
		message: 'downloading embedding model (this may take a while)',
		percentage: 40,
	},
	preprocess: {
		message: 'preprocessing tasks',
		percentage: 50,
	},
	filterWorkTasks: {
		message: 'filtering work tasks',
		percentage: 55,
	},
	groupingTaskTitles: {
		message: 'grouping tasks by title',
		percentage: 50,
	},
	parseTaskDescriptions: {
		message: 'parsing task descriptions',
		percentage: 65,
	},
	removeSimilarDescriptions: {
		message: 'removing similar task descriptions',
		percentage: 85,
	},
	finalizing: {
		message: 'format and sorting summary',
		percentage: 90,
	},
	done: {
		message: 'summary complete',
		percentage: 100,
	},
} as const satisfies ProgressConfig;
