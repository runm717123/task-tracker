import { DebouncedProgressReporter } from './debounced-progress';

/**
 * Progress tracker utility for smooth progress reporting
 */
export class ProgressTracker {
	private currentStep = 0;
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
	 * Move to the next step
	 */
	nextStep(customMessage?: string) {
		if (this.currentStep < this.totalSteps) {
			const message = customMessage || this.stepNames[this.currentStep];
			const percentage = Math.round(((this.currentStep + 1) / this.totalSteps) * 100);
			this.progressReporter.report(`${message} (${percentage}%)`);
			this.currentStep++;
		}
	}

	/**
	 * Update current step with sub-progress
	 */
	updateCurrentStep(subProgress: number, customMessage?: string) {
		if (this.currentStep < this.totalSteps) {
			const message = customMessage || this.stepNames[this.currentStep];
			const baseProgress = (this.currentStep / this.totalSteps) * 100;
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
