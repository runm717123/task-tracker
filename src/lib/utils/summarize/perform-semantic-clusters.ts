import { calculateCosineSimilarity } from "./calc-cosine-similarity";

/**
 * Performs semantic clustering on texts using cosine similarity
 */
export function performSemanticClustering(texts: string[], vectors: number[][], threshold: number): string[][] {
	const used = new Array(texts.length).fill(false);
	const clusters: string[][] = [];

	for (let i = 0; i < vectors.length; i++) {
		if (used[i]) continue;

		const cluster = [texts[i]];
		used[i] = true;

		for (let j = i + 1; j < vectors.length; j++) {
			if (used[j]) continue;

			const similarity = calculateCosineSimilarity(vectors[i], vectors[j]);
			if (similarity > threshold) {
				cluster.push(texts[j]);
				used[j] = true;
			}
		}

		clusters.push(cluster);
	}

	return clusters.sort((a, b) => b.length - a.length);
}