import '@tensorflow/tfjs'; // MUST come before @tensorflow-models
import * as use from '@tensorflow-models/universal-sentence-encoder';


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
			onProgress('DOWNLOADING MINIFIED MODEL... (THIS WILL BE CACHED FOR FUTURE USE)');
		}

		const modelUrl = chrome.runtime.getURL('models/universal-sentence-encoder/model.json');
		modelCache = await use.load({
			modelUrl: modelUrl,
		});

		if (onProgress) {
			onProgress('MODEL LOADED SUCCESSFULLY');
		}

		return modelCache;
	} finally {
		isModelLoading = false;
	}
}
