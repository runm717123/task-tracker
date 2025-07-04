interface ITrackedTask {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'in-progress' | 'done';

	// ISO 8601 date strings
	createdAt: string;
	start: string | null;
	end: string | null;
}