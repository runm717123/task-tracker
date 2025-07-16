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

	// separate task items by commas

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
