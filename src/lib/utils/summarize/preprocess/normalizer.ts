/**
 * Converts ITrackedTask array to ParsedTask array
 */
export function normalizeTasks(tasks: ITrackedTask[]): Pick<ITrackedTask, 'title' | 'description'>[] {
	return tasks.map((task) => ({
		title: task.title.trim() || 'General Tasks',
		description: task.description.trim() || '',
	}));
}
