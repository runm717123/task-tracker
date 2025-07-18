import { DebouncedProgressReporter } from './debounced-progress';

/**
 * Progress tracker utility for smooth progress reporting
 */
export class ProgressTracker {
	private completedSteps = 0;
	private totalSteps = 0;
	private stepNames: string[] = [];
	private progressReporter: DebouncedProgressReporter;

	constructor(steps: string[], onProgress?: (status: string) => void) {
		this.totalSteps = steps.length;
		this.stepNames = steps;
		this.progressReporter = new DebouncedProgressReporter(
			onProgress || (() => {}), 
			150 // 150ms debounce for smoother updates
		);
	}

	/**
	 * Report that a step has been completed
	 */
	reportStepComplete(stepName: string, customMessage?: string) {
		this.completedSteps++;
		const message = customMessage || stepName;
		const percentage = Math.round((this.completedSteps / this.totalSteps) * 100);
		this.progressReporter.report(`${message} (${percentage}%)`);
	}

	/**
	 * Update current step with sub-progress (for long-running operations)
	 */
	updateCurrentStepProgress(customMessage: string) {
		const baseProgress = (this.completedSteps / this.totalSteps) * 100;
		// Add a small amount for sub-progress to show activity without inflating percentage
		const subProgressBonus = Math.min(5, (1 / this.totalSteps) * 50); // Max 5% bonus for sub-progress
		const totalProgress = Math.round(baseProgress + subProgressBonus);
		this.progressReporter.report(`${customMessage} (${Math.min(totalProgress, 100)}%)`);
	}

	/**
	 * Move to the next step
	 * @deprecated Use reportStepComplete instead for more accurate progress tracking
	 */
	nextStep(customMessage?: string) {
		if (this.completedSteps < this.totalSteps) {
			const message = customMessage || this.stepNames[this.completedSteps];
			const percentage = Math.round(((this.completedSteps + 1) / this.totalSteps) * 100);
			this.progressReporter.report(`${message} (${percentage}%)`);
			this.completedSteps++;
		}
	}

	/**
	 * Update current step with sub-progress
	 * @deprecated Use updateCurrentStepProgress instead
	 */
	updateCurrentStep(subProgress: number, customMessage?: string) {
		if (this.completedSteps < this.totalSteps) {
			const message = customMessage || this.stepNames[this.completedSteps];
			const baseProgress = (this.completedSteps / this.totalSteps) * 100;
			const stepProgress = (subProgress / this.totalSteps) * 100;
			const totalProgress = Math.round(baseProgress + stepProgress);
			this.progressReporter.report(`${message} (${Math.min(totalProgress, 100)}%)`);
		}
	}

	/**
	 * Complete all steps
	 */
	complete(message: string = 'Complete!') {
		this.progressReporter.flush();
		this.progressReporter.report(message);
	}

	/**
	 * Clean up resources
	 */
	destroy() {
		this.progressReporter.destroy();
	}
}
