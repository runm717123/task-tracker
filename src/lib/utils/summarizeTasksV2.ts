import '@tensorflow/tfjs'; // MUST come before @tensorflow-models
import * as use from '@tensorflow-models/universal-sentence-encoder';

interface SummaryGroup {
	title: string;
	tasks: string[];
}

interface ParsedTask {
	title: string;
	description: string;
}

// Cache the model instance
let modelCache: use.UniversalSentenceEncoder | null = null;

async function getModel() {
	if (!modelCache) {
		modelCache = await use.load();
	}
	return modelCache;
}

/**
 * Parses ITrackedTask array and groups tasks by semantic similarity and title
 * Filters out non-work related tasks (breaks, personal activities)
 * @param tasks Array of tracked tasks
 * @param similarityThreshold Minimum similarity score for grouping similar titles (0-1)
 * @returns Grouped summary data for display
 */
export async function summarizeTasksV2(tasks: ITrackedTask[], similarityThreshold: number = 0.7): Promise<SummaryGroup[]> {
	if (tasks.length === 0) return [];
	
	try {
		const parsedTasks = parseTrackedTasks(tasks);
		const workTasks = filterWorkTasks(parsedTasks);
		const grouped = await groupTasksBySemanticSimilarity(workTasks, similarityThreshold);
		return formatSummaryGroups(grouped);
	} catch (error) {
		console.error('Error in summarizeTasksV2:', error);
		// Fallback to simple grouping
		const parsedTasks = parseTrackedTasks(tasks);
		const workTasks = filterWorkTasks(parsedTasks);
		const grouped = groupTasksByTitle(workTasks);
		return formatSummaryGroups(grouped);
	}
}

/**
 * Synchronous version for parsing text input (backward compatibility)
 * @param taskText Raw text with # titles and descriptions
 * @returns Grouped summary data for display
 */
export function summarizeTasksV2Sync(taskText: string): SummaryGroup[] {
	const tasks = parseTaskText(taskText);
	const workTasks = filterWorkTasks(tasks);
	const grouped = groupTasksByTitle(workTasks);
	return formatSummaryGroups(grouped);
}

/**
 * Converts ITrackedTask array to ParsedTask array
 */
function parseTrackedTasks(tasks: ITrackedTask[]): ParsedTask[] {
	return tasks.map(task => ({
		title: task.title || '',
		description: task.description || ''
	}));
}

/**
 * Parses the raw text into structured task objects (for text input)
 */
function parseTaskText(text: string): ParsedTask[] {
	const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	const tasks: ParsedTask[] = [];
	
	let currentTitle = '';
	let currentDescription: string[] = [];
	
	for (const line of lines) {
		if (line.startsWith('#')) {
			// Save previous task if exists
			if (currentTitle || currentDescription.length > 0) {
				tasks.push({
					title: currentTitle.trim(),
					description: currentDescription.join('\n').trim()
				});
			}
			
			// Start new task
			currentTitle = line.replace(/^#+\s*/, '');
			currentDescription = [];
		} else {
			// Add to current description
			currentDescription.push(line);
		}
	}
	
	// Save last task
	if (currentTitle || currentDescription.length > 0) {
		tasks.push({
			title: currentTitle.trim(),
			description: currentDescription.join('\n').trim()
		});
	}
	
	return tasks;
}

/**
 * Groups tasks by semantic similarity using ML embeddings
 */
async function groupTasksBySemanticSimilarity(tasks: ParsedTask[], similarityThreshold: number): Promise<Map<string, string[]>> {
	if (tasks.length === 0) return new Map();
	
	try {
		const model = await getModel();
		
		// Prepare text for embedding (combine title and description)
		const taskTexts = tasks.map(task => {
			const title = task.title.trim();
			const description = task.description.trim();
			return title && description ? `${title}: ${description}`.toLowerCase() : (title || description).toLowerCase();
		});
		
		// Generate embeddings
		const embeddings = await model.embed(taskTexts);
		const embeddingVectors = await embeddings.array();
		
		if (!embeddingVectors || embeddingVectors.length !== taskTexts.length) {
			throw new Error('Failed to generate embeddings');
		}
		
		// Group titles by semantic similarity
		const titleGroups = performSemanticClustering(
			tasks.map(task => task.title || 'General Tasks'), 
			embeddingVectors, 
			similarityThreshold
		);
		
		// Create groups with representative title and task descriptions
		const groups = new Map<string, string[]>();
		
		for (const titleGroup of titleGroups) {
			if (titleGroup.length === 0) continue;
			
			// Use the most common or shortest title as representative
			const representativeTitle = findRepresentativeTitle(titleGroup);
			
			// Collect all task descriptions for this title group
			const taskItems: string[] = [];
			
			for (const title of titleGroup) {
				const matchingTasks = tasks.filter(task => task.title === title);
				for (const task of matchingTasks) {
					const items = parseTaskDescription(task.description);
					taskItems.push(...items);
				}
			}
			
			if (taskItems.length > 0) {
				groups.set(representativeTitle, taskItems);
			}
		}
		
		return groups;
	} catch (error) {
		console.error('Error in semantic grouping:', error);
		// Fallback to simple grouping
		return groupTasksByTitle(tasks);
	}
}

/**
 * Calculates cosine similarity between two vectors
 */
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
	const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
	const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

	if (magnitudeA === 0 || magnitudeB === 0) return 0;

	return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Performs semantic clustering on texts using cosine similarity
 */
function performSemanticClustering(texts: string[], vectors: number[][], threshold: number): string[][] {
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

/**
 * Finds the most representative title from a group of similar titles
 */
function findRepresentativeTitle(titles: string[]): string {
	if (titles.length === 1) return titles[0];
	
	// Remove empty titles
	const nonEmptyTitles = titles.filter(title => title.trim().length > 0);
	if (nonEmptyTitles.length === 0) return 'General Tasks';
	
	// For sprint-like titles, normalize them
	const sprintTitles = nonEmptyTitles.filter(title => /sprint\s*\d+/i.test(title));
	if (sprintTitles.length > 0) {
		// If all are sprint titles, just use "Sprint Work"
		if (sprintTitles.length === nonEmptyTitles.length) {
			return 'Sprint Work';
		}
	}
	
	// Count frequency of normalized titles
	const titleCounts = new Map<string, { count: number; original: string }>();
	
	for (const title of nonEmptyTitles) {
		const normalized = normalizeTitle(title);
		const current = titleCounts.get(normalized) || { count: 0, original: title };
		current.count++;
		// Keep the shortest original title
		if (title.length < current.original.length) {
			current.original = title;
		}
		titleCounts.set(normalized, current);
	}
	
	// Return the most frequent normalized title's shortest original
	const mostFrequent = Array.from(titleCounts.entries())
		.sort((a, b) => b[1].count - a[1].count)[0];
		
	return mostFrequent[1].original;
}

/**
 * Filters out non-work related tasks (breaks, personal activities, etc.)
 * Enhanced to detect more variations and semantic meanings
 */
function filterWorkTasks(tasks: ParsedTask[]): ParsedTask[] {
	const nonWorkKeywords = [
		// Break and meals
		'break', 'lunch', 'dinner', 'breakfast', 'eat', 'meal', 'snack', 'coffee',
		// Education and learning (personal)
		'english', 'class', 'course', 'lesson', 'study', 'learning',
		// Training and workshops (optional - might be work-related)
		'training', 'workshop', 'seminar', 'conference',
		// Personal activities
		'personal', 'doctor', 'appointment', 'dentist', 'medical',
		// Time off
		'vacation', 'holiday', 'off', 'sick', 'leave',
		// Exercise and health
		'gym', 'exercise', 'workout', 'fitness', 'yoga',
		// Social activities
		'party', 'social', 'hangout', 'fun',
		// Commute and travel
		'commute', 'travel', 'driving',
		// Household and errands
		'shopping', 'groceries', 'cleaning', 'laundry', 'errands',
		// Family and relationships
		'family', 'kids', 'children', 'spouse', 'date'
	];
	
	const workIndicators = [
		// Development work
		'code', 'coding', 'programming', 'development', 'dev',
		'bug', 'fix', 'issue', 'feature', 'implement',
		'review', 'test', 'testing', 'debug', 'deploy',
		// Project work
		'sprint', 'project', 'task', 'ticket', 'work',
		'meeting', 'standup', 'sync', 'call', 'client',
		// Research and planning
		'research', 'analysis', 'design', 'plan', 'architecture'
	];
	
	return tasks.filter(task => {
		const combinedText = `${task.title} ${task.description}`.toLowerCase();
		
		// Skip completely empty tasks
		if (!task.title.trim() && !task.description.trim()) return false;
		
		// Check for explicit work indicators first
		const hasWorkIndicators = workIndicators.some(keyword => 
			combinedText.includes(keyword)
		);
		
		// If it has work indicators, keep it even if it has some non-work keywords
		if (hasWorkIndicators) return true;
		
		// Check for non-work keywords
		const hasNonWorkKeywords = nonWorkKeywords.some(keyword => 
			combinedText.includes(keyword)
		);
		
		// If no work indicators and has non-work keywords, filter it out
		if (hasNonWorkKeywords && !hasWorkIndicators) return false;
		
		// Keep everything else (assume work-related if unclear)
		return true;
	});
}

/**
 * Groups tasks by their titles, merging similar titles
 */
function groupTasksByTitle(tasks: ParsedTask[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	
	for (const task of tasks) {
		const normalizedTitle = normalizeTitle(task.title);
		const taskItems = parseTaskDescription(task.description);
		
		if (!groups.has(normalizedTitle)) {
			groups.set(normalizedTitle, []);
		}
		
		groups.get(normalizedTitle)!.push(...taskItems);
	}
	
	return groups;
}

/**
 * Normalizes title to group similar titles together
 */
function normalizeTitle(title: string): string {
	if (!title) return 'General Tasks';
	
	// Remove common variations and normalize
	const normalized = title
		.toLowerCase()
		.replace(/sprint\s*\d+/i, 'Sprint') // Normalize "Sprint 10", "Sprint 11" to "Sprint"
		.replace(/week\s*\d+/i, 'Week')
		.replace(/day\s*\d+/i, 'Day')
		.replace(/\s+/g, ' ')
		.trim();
	
	// If title becomes empty after normalization, return original
	if (!normalized || normalized === 'sprint' || normalized === 'week' || normalized === 'day') {
		// For sprint numbers, keep them separate
		if (title.toLowerCase().includes('sprint')) {
			return title; // Keep original sprint title
		}
		return 'General Tasks';
	}
	
	// Capitalize first letter
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Parses task description into individual task items
 */
function parseTaskDescription(description: string): string[] {
	if (!description) return [];
	
	const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);
	const tasks: string[] = [];
	
	for (const line of lines) {
		// Handle bullet points
		if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
			const task = line.replace(/^[-•*]\s*/, '').trim();
			if (task) tasks.push(task);
		}
		// Handle numbered lists
		else if (/^\d+\.\s/.test(line)) {
			const task = line.replace(/^\d+\.\s*/, '').trim();
			if (task) tasks.push(task);
		}
		// Handle regular lines (treat each line as a task)
		else {
			// Skip URLs on their own line
			if (!line.startsWith('http') && !line.startsWith('www.')) {
				tasks.push(line);
			}
		}
	}
	
	// If no structured tasks found, treat the whole description as one task
	if (tasks.length === 0 && description.trim()) {
		tasks.push(description.trim());
	}
	
	return tasks;
}

/**
 * Formats the grouped tasks into the final summary structure
 */
function formatSummaryGroups(groups: Map<string, string[]>): SummaryGroup[] {
	const result: SummaryGroup[] = [];
	
	for (const [title, tasks] of groups) {
		if (tasks.length > 0) {
			result.push({
				title,
				tasks: [...new Set(tasks)] // Remove duplicates
			});
		}
	}
	
	// Sort by title for consistent output
	result.sort((a, b) => {
		// Put "General Tasks" at the end
		if (a.title === 'General Tasks') return 1;
		if (b.title === 'General Tasks') return -1;
		return a.title.localeCompare(b.title);
	});
	
	return result;
}

/**
 * Utility function to format the summary for display
 */
export function formatSummaryForDisplay(summary: SummaryGroup[]): string {
	return summary.map(group => {
		const tasks = group.tasks.map(task => `- ${task}`).join('\n');
		return `# ${group.title}\n${tasks}`;
	}).join('\n\n');
}
