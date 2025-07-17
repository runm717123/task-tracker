/**
 * Parses task description into individual task items
 */
export function parseTaskDescription(description: string): string[] {
	if (!description) return [];

	const lines = description
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	let tasks: string[] = [];

	for (const line of lines) {
		// Filter the line using regex, remove initial characters that are not alphabet or number
		const filteredLine = line.replace(/^[^a-zA-Z0-9]*/, '').trim();

		// Check if the filtered line starts with http, if true, continue
		if (filteredLine.startsWith('http')) {
			continue;
		}

		// Push filtered line to task
		if (filteredLine) {
			tasks.push(filteredLine);
		}
	}

	tasks = tasks
		.map((task) => {
			return task.split(',').map((item) => item.trim());
		})
		.flat();

	// If no structured tasks found, treat the whole description as one task
	if (tasks.length === 0 && description.trim()) {
		tasks.push(description.trim());
	}

	return tasks;
}
