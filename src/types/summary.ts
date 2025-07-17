export const SummaryProgressStatus = {
	IDLE: '',
	PREPROCESSING: 'Preprocessing tasks...',
	FILTERING: 'Filtering work tasks...',
	LOADING_MODEL: 'Loading AI model...',
	DOWNLOADING_MODEL: 'DOWNLOADING MINIFIED MODEL... (THIS WILL BE CACHED FOR FUTURE USE)',
	MODEL_LOADED: 'MODEL LOADED SUCCESSFULLY',
	GROUPING: 'Grouping similar tasks...',
	REMOVING_DUPLICATES: 'Removing duplicates...',
	FINALIZING: 'Finalizing summary...',
	GENERATING: 'Generating summary...',
} as const;

export type TSummaryProgressStatusType = typeof SummaryProgressStatus[keyof typeof SummaryProgressStatus] | string;

export interface ISummaryProgressState {
	status: TSummaryProgressStatusType;
	isGenerating: boolean;
}
