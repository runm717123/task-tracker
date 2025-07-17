import '@tensorflow/tfjs'; // MUST come before @tensorflow-models
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { SummaryProgressStatus } from '../../../types/summary';

// Cache the model instance
let modelCache: use.UniversalSentenceEncoder | null = null;
let isModelLoading = false;

export async function getModel(onProgress?: (status: string) => void) {
	if (modelCache) {
		return modelCache;
	}

	if (isModelLoading) {
		// Wait for the existing loading to complete
		while (isModelLoading) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return modelCache!;
	}

	try {
		isModelLoading = true;
		if (onProgress) {
			onProgress(SummaryProgressStatus.DOWNLOADING_MODEL);
		}

		const modelUrl = chrome.runtime.getURL('models/universal-sentence-encoder/model.json');
		modelCache = await use.load({
			modelUrl: import.meta.env.dev ? modelUrl : undefined,
		});

		if (onProgress) {
			onProgress(SummaryProgressStatus.MODEL_LOADED);
		}

		return modelCache;
	} finally {
		isModelLoading = false;
	}
}
