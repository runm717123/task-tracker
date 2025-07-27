import { isValidSentences } from '../is-valid-sentences';

/**
 * the description is a big chunk of text
 * it can contain multiple tasks, separated by commas or new lines
 * this function parses the description and return array of extracted tasks
 */
export async function parseTaskDescription(description: string) {
	if (!description) return [];

	const lines = description
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	let tasks: string[] = [];

	for (const line of lines) {
		const statusWords = '(done|in progress|completed|pending|todo|finished)';
		const statusRegexStart = new RegExp(`^${statusWords}\\s*(-|->)\\s*`, 'i');
		const statusRegexEnd = new RegExp(`\\s*(-|->|\\()\\s*${statusWords}\\s*\\)?$`, 'i');

		const filteredLine = line
			// Filter the line using regex, remove initial characters that are not alphabet or number
			.replace(/^[^a-zA-Z0-9]*/, '')
			// Remove status at the beginning: "Done -> task", "Done - task"
			.replace(statusRegexEnd, '')
			.replace(statusRegexStart, '')
			.trim();

		// Check if the filtered line starts with http, if true, continue
		if (filteredLine.startsWith('http')) {
			continue;
		}

		// Push filtered line to task
		if (filteredLine) {
			const parsed = await parseSplittedTasks(filteredLine.split(',').filter((t) => !!t.trim().length));
			tasks.push(...parsed);
		}
	}

	// If no structured tasks found, treat the whole description as one task
	if (tasks.length === 0 && description.trim()) {
		tasks.push(description.trim());
	}

	tasks = await parseSplittedTasks(tasks);

	return tasks;
}

export const parseSplittedTasks = async (splittedTasks: string[]): Promise<string[]> => {
	if (!splittedTasks) return [];

	// If only one task, return as is
	if (splittedTasks.length <= 1) {
		return splittedTasks;
	}

	// Validate the sentences
	const validationResults = await isValidSentences(splittedTasks);

	const allZeros = validationResults.every((result) => result === 0);
	if (allZeros) {
		return [splittedTasks.join(', ')];
	}

	// turn [0, 0, 1, 0] into [1, 1, 1, 0]
	const firstValidIndex = validationResults.findIndex((result) => result === 1);
	const transformedIndexes = validationResults.map((result, index) => (index < firstValidIndex ? 1 : result));

	// turn [1, 1, 1, 0] into [1, 1, 1]
	// combine last invalid text with the last valid text

	// return all if all of them are valid
	const lastValidIndex = transformedIndexes.lastIndexOf(1);
	if (lastValidIndex === splittedTasks.length - 1) {
		return splittedTasks;
	}

	let lastValidText = splittedTasks[lastValidIndex];
	if (lastValidIndex < transformedIndexes.length - 1) {
		lastValidText = splittedTasks.splice(lastValidIndex).join(', ');
	}

	return [...splittedTasks, lastValidText];
};
