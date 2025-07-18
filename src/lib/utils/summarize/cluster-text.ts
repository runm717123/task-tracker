import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { performSemanticClustering } from './perform-semantic-clusters';

// group text by its semantic similarity
export async function clusterTexts(texts: string[], model: UniversalSentenceEncoder, threshold: number) {
	if (texts.length === 0) return [];

	// Yield control before heavy computation
	await new Promise((resolve) => setTimeout(resolve, 0));

	const embeddings = await model.embed(texts);

	// Yield control after embedding generation
	await new Promise((resolve) => setTimeout(resolve, 0));

	const embeddingVectors = await embeddings.array();

	// Yield control before clustering
	await new Promise((resolve) => setTimeout(resolve, 0));

	return await performSemanticClustering(texts, embeddingVectors, threshold);
}
