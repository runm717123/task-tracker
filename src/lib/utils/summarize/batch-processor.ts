/**
 * Processes an array in chunks to maintain UI responsiveness
 */
export async function processInChunks<T, R>(
	items: T[],
	processor: (item: T, index: number) => R | Promise<R>,
	chunkSize: number = 10,
	onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
	const results: R[] = [];
	
	for (let i = 0; i < items.length; i += chunkSize) {
		const chunk = items.slice(i, i + chunkSize);
		
		// Process chunk
		for (let j = 0; j < chunk.length; j++) {
			const result = await processor(chunk[j], i + j);
			results.push(result);
		}
		
		// Report progress
		const processed = Math.min(i + chunkSize, items.length);
		onProgress?.(processed, items.length);
		
		// Yield control to prevent blocking
		if (i + chunkSize < items.length) {
			await new Promise(resolve => setTimeout(resolve, 0));
		}
	}
	
	return results;
}

/**
 * Processes an array in chunks with a batch processor function
 */
export async function processBatchInChunks<T, R>(
	items: T[],
	batchProcessor: (batch: T[]) => R[] | Promise<R[]>,
	chunkSize: number = 10,
	onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
	const results: R[] = [];
	
	for (let i = 0; i < items.length; i += chunkSize) {
		const chunk = items.slice(i, i + chunkSize);
		
		// Process chunk as batch
		const chunkResults = await batchProcessor(chunk);
		results.push(...chunkResults);
		
		// Report progress
		const processed = Math.min(i + chunkSize, items.length);
		onProgress?.(processed, items.length);
		
		// Yield control to prevent blocking
		if (i + chunkSize < items.length) {
			await new Promise(resolve => setTimeout(resolve, 0));
		}
	}
	
	return results;
}

/**
 * Simple utility to yield control to the browser
 */
export function yieldControl(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
