
/**
 * Filters out non-work related tasks (breaks, personal activities, etc.)
 * Enhanced to detect more variations and semantic meanings
 */
// TODO: make a classifier to simplify this logic
export function filterWorkTasks(tasks: IParsedTask[]): IParsedTask[] {
	const nonWorkKeywords = [
		// Break and meals
		'break',
		'lunch',
		'dinner',
		'breakfast',
		'eat',
		'meal',
		'snack',
		'coffee',
		// Education and learning (personal)
		'english',
		'class',
		'course',
		'lesson',
		'study',
		'learning',
		// Training and workshops (optional - might be work-related)
		'training',
		'workshop',
		'seminar',
		'conference',
		// Personal activities
		'personal',
		'doctor',
		'appointment',
		'dentist',
		'medical',
		// Time off
		'vacation',
		'holiday',
		'off',
		'sick',
		'leave',
		// Exercise and health
		'gym',
		'exercise',
		'workout',
		'fitness',
		'yoga',
		// Social activities
		'party',
		'social',
		'hangout',
		'fun',
		// Commute and travel
		'commute',
		'travel',
		'driving',
		// Household and errands
		'shopping',
		'groceries',
		'cleaning',
		'laundry',
		'errands',
		// Family and relationships
		'family',
		'kids',
		'children',
		'spouse',
		'date',
	];

	const workIndicators = [
		// Development work
		'code',
		'coding',
		'programming',
		'development',
		'dev',
		'bug',
		'fix',
		'issue',
		'feature',
		'implement',
		'review',
		'test',
		'testing',
		'debug',
		'deploy',
		// Project work
		'sprint',
		'project',
		'task',
		'ticket',
		'work',
		'meeting',
		'standup',
		'sync',
		'call',
		'client',
		// Research and planning
		'research',
		'analysis',
		'design',
		'plan',
		'architecture',
	];

	return tasks.filter((task) => {
		const combinedText = `${task.title} ${task.description}`.toLowerCase();

		// Skip completely empty tasks
		if (!task.title.trim() && !task.description.trim()) return false;

		// Check for explicit work indicators first
		const hasWorkIndicators = workIndicators.some((keyword) => combinedText.includes(keyword));

		// If it has work indicators, keep it even if it has some non-work keywords
		if (hasWorkIndicators) return true;

		// Check for non-work keywords
		const hasNonWorkKeywords = nonWorkKeywords.some((keyword) => combinedText.includes(keyword));

		// If no work indicators and has non-work keywords, filter it out
		if (hasNonWorkKeywords && !hasWorkIndicators) return false;

		// Keep everything else (assume work-related if unclear)
		return true;
	});
}