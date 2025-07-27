import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

// Cache the model instance
let modelCache: use.UniversalSentenceEncoder | null = null;
let isModelLoading = false;

export async function getModel() {
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

		if (import.meta.env.WXT_ENV === 'dev') {
			const localModelUrl = chrome.runtime.getURL('models/universal-sentence-encoder/model.json');
			modelCache = await use.load({
				modelUrl: localModelUrl,
			});
		} else {
			modelCache = await use.load();
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

		const classifierUrl = chrome.runtime.getURL('models/classifier/model.json');
		classifierCache = await tf.loadLayersModel(classifierUrl);

		return classifierCache;
	} finally {
		isClassifierLoading = false;
	}
}

let sentenceValidatorModelCache: tf.LayersModel | null = null;
let isSentenceValidatorModelLoading = false;

export async function getSentenceValidatorModel() {
	if (sentenceValidatorModelCache) {
		return sentenceValidatorModelCache;
	}

	// little hack to ensure L2 regularizer is registered
	// https://stackoverflow.com/questions/64063914/unknown-regularizer-l2-in-tensorflowjs
	class L2 {
		static className = 'L2'; // Must match what appears in model.json

		constructor(config: any) {
			return tf.regularizers.l1l2(config); // return compatible instance
		}
	}
	tf.serialization.registerClass(L2 as any);

	if (isSentenceValidatorModelLoading) {
		while (isSentenceValidatorModelLoading) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		return sentenceValidatorModelCache!;
	}

	try {
		isSentenceValidatorModelLoading = true;

		const modelUrl = chrome.runtime.getURL('models/sentence-validator/model.json');
		sentenceValidatorModelCache = await tf.loadLayersModel(modelUrl);

		return sentenceValidatorModelCache;
	} finally {
		isSentenceValidatorModelLoading = false;
	}
}
