import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { performSemanticClustering } from './perform-semantic-clusters';

// group text by its semantic similarity
export async function clusterTexts(texts: string[], model: UniversalSentenceEncoder, threshold: number) {
	if (texts.length === 0) return [];
	const embeddings = await model.embed(texts);
	const embeddingVectors = await embeddings.array();

	return performSemanticClustering(texts, embeddingVectors, threshold);
}
