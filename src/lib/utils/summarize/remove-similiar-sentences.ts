import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { calculateCosineSimilarity } from './calc-cosine-similarity';

export async function removeSimilarSentences(sentences: string[], model: UniversalSentenceEncoder, threshold: number) {
	const embeddings = await model.embed(sentences);
	const embeddingVectors = await embeddings.array();

	const uniqueSentences: string[] = [];
	const used = new Array(sentences.length).fill(false);

	for (let i = 0; i < embeddingVectors.length; i++) {
		if (used[i]) continue;
		uniqueSentences.push(sentences[i]);
		used[i] = true;

		for (let j = i + 1; j < embeddingVectors.length; j++) {
			if (used[j]) continue;
			const similarity = calculateCosineSimilarity(embeddingVectors[i], embeddingVectors[j]);
			if (similarity > threshold) {
				used[j] = true;
			}
		}
	}

	return uniqueSentences;
}
