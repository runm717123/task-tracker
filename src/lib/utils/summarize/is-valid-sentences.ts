import type { Tensor } from '@tensorflow/tfjs';
import { getModel, getSentenceValidatorModel } from './get-model';

/**
 * Validates an array of sentences using a machine learning model.
 * @param sentences Array of sentences to validate
 * @returns Promise resolving to an array of 1 or 0 indicating valid sentences
 * e.g [1, 0, 1] means first and third sentences are valid, second is not
 */
export async function isValidSentences(sentences: string[]) {
	const embedModel = await getModel();
	const sentenceValidatorModel = await getSentenceValidatorModel();

	const embeddings = await embedModel.embed(sentences);
	const predictions = sentenceValidatorModel.predict(embeddings);

	const predictionTensor = predictions as Tensor;
	const predictionArray = (await predictionTensor.array()) as number[][];
	const predictedIndices = predictionArray.map((row) => Math.round(row[0]));

	return predictedIndices;
}
