/**
 * Debounced progress reporter to prevent excessive UI updates
 */
export class DebouncedProgressReporter {
	private lastUpdate = 0;
	private readonly debounceMs: number;
	private readonly onProgress: (status: string) => void;
	private pendingStatus: string | null = null;
	private timeoutId: number | null = null;

	constructor(onProgress: (status: string) => void, debounceMs: number = 100) {
		this.onProgress = onProgress;
		this.debounceMs = debounceMs;
	}

	/**
	 * Report progress with debouncing
	 */
	report(status: string) {
		const now = Date.now();
		
		// If enough time has passed, update immediately
		if (now - this.lastUpdate >= this.debounceMs) {
			this.onProgress(status);
			this.lastUpdate = now;
			this.clearPending();
			return;
		}

		// Otherwise, debounce the update
		this.pendingStatus = status;
		
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}

		this.timeoutId = setTimeout(() => {
			if (this.pendingStatus) {
				this.onProgress(this.pendingStatus);
				this.lastUpdate = Date.now();
				this.clearPending();
			}
		}, this.debounceMs - (now - this.lastUpdate)) as unknown as number;
	}

	/**
	 * Force immediate update of any pending status
	 */
	flush() {
		if (this.pendingStatus) {
			this.onProgress(this.pendingStatus);
			this.lastUpdate = Date.now();
			this.clearPending();
		}
	}

	private clearPending() {
		this.pendingStatus = null;
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	/**
	 * Clean up any pending timeouts
	 */
	destroy() {
		this.clearPending();
	}
}
