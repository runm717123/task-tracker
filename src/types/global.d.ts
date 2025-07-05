interface ITask {
	title: string;
	description: string;
	status?: 'pending' | 'in-progress' | 'done';
}

interface ITrackedTask extends ITask {
	id: string;

	// ISO 8601 date strings
	createdAt: string;
	start: string | null;
	end: string | null;
}

interface ICreateTask extends ITask {}
