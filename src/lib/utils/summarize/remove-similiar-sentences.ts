import type { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import { calculateCosineSimilarity } from './calc-cosine-similarity';

export async function removeSimilarSentences(sentences: string[], model: UniversalSentenceEncoder, threshold: number) {
	// Early exit for small datasets
	if (sentences.length <= 1) return sentences;
	
	// Remove exact duplicates first (much faster than semantic comparison)
	const uniqueSentences = [...new Set(sentences)];
	if (uniqueSentences.length <= 1) return uniqueSentences;
	
	// Filter out very short sentences that are likely not meaningful
	const meaningfulSentences = uniqueSentences.filter(s => s.trim().length > 3);
	if (meaningfulSentences.length <= 1) return meaningfulSentences;

	const embeddings = await model.embed(meaningfulSentences);
	const embeddingVectors = await embeddings.array();

	const finalUniqueSentences: string[] = [];
	const used = new Array(meaningfulSentences.length).fill(false);

	for (let i = 0; i < embeddingVectors.length; i++) {
		if (used[i]) continue;
		finalUniqueSentences.push(meaningfulSentences[i]);
		used[i] = true;

		// Only check remaining sentences to avoid duplicate comparisons
		for (let j = i + 1; j < embeddingVectors.length; j++) {
			if (used[j]) continue;
			const similarity = calculateCosineSimilarity(embeddingVectors[i], embeddingVectors[j]);
			if (similarity > threshold) {
				used[j] = true;
			}
		}
	}

	return finalUniqueSentences;
}
