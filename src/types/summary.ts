export const SummaryProgressStatus = {
	IDLE: '',
	PREPROCESSING: 'Preprocessing tasks...',
	FILTERING: 'Filtering work tasks...',
	LOADING_MODEL: 'Loading AI model...',
	LOADING_CLASSIFIER: 'Loading classifier model...',
	CLASSIFIER_LOADED: 'Classifier model loaded, proceeding with classifying task titles...',
	DOWNLOADING_MODEL: 'DOWNLOADING MINIFIED MODEL... (THIS WILL BE CACHED FOR NEXT USE)',
	MODEL_LOADED: 'MODEL LOADED SUCCESSFULLY',
	GROUPING: 'Grouping similar tasks...',
	CLUSTERING: 'Clustering similar titles...',
	ANALYZING_PATTERNS: 'Analyzing title patterns...',
	PROCESSING_GROUPS: 'Processing task groups...',
	REMOVING_DUPLICATES: 'Removing duplicates...',
	COLLECTING_TASKS: 'Collecting tasks for deduplication...',
	ANALYZING_SIMILARITIES: 'Analyzing semantic similarities...',
	REBUILDING_GROUPS: 'Rebuilding task groups...',
	FINALIZING: 'Finalizing summary...',
	GENERATING: 'Generating summary...',
} as const;

export type TSummaryProgressStatusType = typeof SummaryProgressStatus[keyof typeof SummaryProgressStatus] | string;

export interface ISummaryProgressState {
	status: TSummaryProgressStatusType;
	isGenerating: boolean;
}
