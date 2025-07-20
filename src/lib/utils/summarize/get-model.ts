import * as tf from '@tensorflow/tfjs'; // MUST come before @tensorflow-models
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
			modelUrl: import.meta.env.DEV ? modelUrl : undefined,
		});

		if (onProgress) {
			onProgress(SummaryProgressStatus.MODEL_LOADED);
		}

		return modelCache;
	} finally {
		isModelLoading = false;
	}
}

let classifierCache: tf.LayersModel | null = null;
let isClassifierLoading = false;

export async function getClassifier(onProgress?: (status: string) => void) {
	if (classifierCache) {
		return classifierCache;
	}

	if (isClassifierLoading) {
		while (isClassifierLoading) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		return classifierCache!;
	}

	try {
		isClassifierLoading = true;
		if (onProgress) {
			onProgress(SummaryProgressStatus.LOADING_CLASSIFIER);
		}

		const classifierUrl = chrome.runtime.getURL('models/classifier/model.json');
		classifierCache = await tf.loadLayersModel(classifierUrl);

		if (onProgress) {
			onProgress(SummaryProgressStatus.CLASSIFIER_LOADED);
		}

		return classifierCache;
	} finally {
		isClassifierLoading = false;
	}
}
