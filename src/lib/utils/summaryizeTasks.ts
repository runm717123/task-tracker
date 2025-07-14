import '@tensorflow/tfjs'; // MUST come before @tensorflow-models
import * as use from '@tensorflow-models/universal-sentence-encoder';

// Cache the model instance
let modelCache: use.UniversalSentenceEncoder | null = null;

async function getModel() {
	if (!modelCache) {
		modelCache = await use.load();
	}
	return modelCache;
}

function labelCluster(group: string[]): string {
	if (group.length === 0) return 'No tasks';
	if (group.length === 1) return group[0];

	const joined = group.join(' ').toLowerCase();
	const words = new Set(joined.split(/\s+/));
	const wordArray = Array.from(words);

	// Pattern matchers for common task types
	const patterns = [
		{
			keywords: ['code', 'review'],
			condition: (words: Set<string>) => [...words].some((w) => w.includes('code') && w.includes('review')) || words.has('review'),
			label: () => `completed ${group.length} code review${group.length > 1 ? 's' : ''}`,
		},
		{
			keywords: ['bug', 'fix', 'issue', 'error'],
			condition: (words: Set<string>) => ['bug', 'fix', 'issue', 'error', 'debug'].some((keyword) => words.has(keyword)),
			label: () => `fixed ${group.length} bug${group.length > 1 ? 's' : ''}`,
		},
		{
			keywords: ['test', 'testing', 'unit'],
			condition: (words: Set<string>) => ['test', 'testing', 'unit', 'spec'].some((keyword) => words.has(keyword)),
			label: () => `wrote ${group.length} test${group.length > 1 ? 's' : ''}`,
		},
		{
			keywords: ['refactor', 'cleanup', 'improve'],
			condition: (words: Set<string>) => ['refactor', 'cleanup', 'improve', 'optimize'].some((keyword) => words.has(keyword)),
			label: () => `refactored ${group.length} component${group.length > 1 ? 's' : ''}`,
		},
		{
			keywords: ['update', 'upgrade'],
			condition: (words: Set<string>) => ['update', 'upgrade', 'modify'].some((keyword) => words.has(keyword)),
			label: () => `updated ${group.length} item${group.length > 1 ? 's' : ''}`,
		},
		{
			keywords: ['create', 'add', 'new'],
			condition: (words: Set<string>) => {
				return ['create', 'add', 'new', 'implement'].some((keyword) => words.has(keyword));
			},
			label: () => {
				const features = group
					.map((desc) => {
						const createMatch = desc.match(/create(?:\s+new)?\s+(\w+)/i);
						const addMatch = desc.match(/add(?:\s+new)?\s+(\w+)/i);
						const newMatch = desc.match(/new\s+(\w+)/i);
						return createMatch?.[1] || addMatch?.[1] || newMatch?.[1];
					})
					.filter(Boolean);

				if (features.length > 0) {
					const uniqueFeatures = [...new Set(features)];
					return `added ${uniqueFeatures.join(' and ')} feature${uniqueFeatures.length > 1 ? 's' : ''}`;
				}
				return `created ${group.length} new item${group.length > 1 ? 's' : ''}`;
			},
		},
	];

	// Check patterns in order of specificity
	for (const pattern of patterns) {
		if (pattern.condition(words)) {
			return pattern.label();
		}
	}

	// Fallback: use most common words to create a meaningful summary
	const wordFreq = new Map<string, number>();
	wordArray.forEach((word) => {
		if (word.length > 2 && !['the', 'and', 'for', 'with', 'from'].includes(word)) {
			wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
		}
	});

	if (wordFreq.size > 0) {
		const topWords = Array.from(wordFreq.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 2)
			.map(([word]) => word);

		return `worked on ${topWords.join(' and ')} (${group.length} task${group.length > 1 ? 's' : ''})`;
	}

	// Ultimate fallback: return shortest string
	return group.sort((a, b) => a.length - b.length)[0];
}

/**
 * Calculates cosine similarity between two vectors
 * @param vectorA First vector
 * @param vectorB Second vector
 * @returns Similarity score between 0 and 1
 */
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
	const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
	const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

	// Avoid division by zero
	if (magnitudeA === 0 || magnitudeB === 0) return 0;

	return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Groups similar task texts using semantic embeddings and clustering
 * @param tasks Array of tracked tasks to summarize
 * @param similarityThreshold Minimum similarity score for clustering (0-1)
 * @returns Array of meaningful summary strings
 */
export async function summarizeTasks(tasks: ITrackedTask[], similarityThreshold: number = 0.85): Promise<string[]> {
	// Early return for edge cases
	if (tasks.length === 0) return [];
	if (tasks.length === 1) return [tasks[0].title || tasks[0].description];

	try {
		// Load the Universal Sentence Encoder model (cached)
		const model = await getModel();

		// Prepare text data for embedding
		const taskTexts = tasks.map((task) => {
			const title = task.title?.trim() || '';
			const description = task.description?.trim() || '';
			// Combine title and description, preferring title if both exist
			return title && description ? `${title}: ${description}`.toLowerCase() : (title || description).toLowerCase();
		});

		// Generate embeddings for all task texts
		const embeddings = await model.embed(taskTexts);
		const embeddingVectors = await embeddings.array();

		// Validate embeddings
		if (!embeddingVectors || embeddingVectors.length !== taskTexts.length) {
			throw new Error('Failed to generate embeddings for tasks');
		}

		// Perform clustering based on semantic similarity
		const clusters = performSemanticClustering(taskTexts, embeddingVectors, similarityThreshold);

		// Generate meaningful labels for each cluster
		const summaries = clusters
			.filter((cluster) => cluster.length > 0)
			.map((cluster) => labelCluster(cluster))
			.filter((summary) => summary.length > 0);

		return summaries.length > 0 ? summaries : ['Completed various tasks'];
	} catch (error) {
		console.error('Error in summarizeTasks:', error);
		// Fallback to simple grouping by task status or type
		return generateFallbackSummary(tasks);
	}
}

/**
 * Performs semantic clustering on task texts using cosine similarity
 */
function performSemanticClustering(texts: string[], vectors: number[][], threshold: number): string[][] {
	const used = new Array(texts.length).fill(false);
	const clusters: string[][] = [];

	for (let i = 0; i < vectors.length; i++) {
		if (used[i]) continue;

		const cluster = [texts[i]];
		used[i] = true;

		// Find similar texts to form a cluster
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

	// Sort clusters by size (largest first) for better summary ordering
	return clusters.sort((a, b) => b.length - a.length);
}

/**
 * Generates a fallback summary when ML processing fails
 */
function generateFallbackSummary(tasks: ITrackedTask[]): string[] {
	const statusGroups = new Map<string, number>();

	tasks.forEach((task) => {
		const status = task.status || 'completed';
		statusGroups.set(status, (statusGroups.get(status) || 0) + 1);
	});

	const summaries: string[] = [];
	for (const [status, count] of statusGroups) {
		const statusLabel = status === 'in-progress' ? 'worked on' : status === 'done' ? 'completed' : status === 'pending' ? 'planned' : 'processed';
		summaries.push(`${statusLabel} ${count} task${count > 1 ? 's' : ''}`);
	}

	return summaries.length > 0 ? summaries : ['Completed various tasks'];
}
