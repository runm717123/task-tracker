/**
 * Calculates cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
	const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
	const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

	if (magnitudeA === 0 || magnitudeB === 0) return 0;

	return dotProduct / (magnitudeA * magnitudeB);
}

