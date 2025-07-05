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

interface ISettings {
	// when the user usually starts working
	// this will initialize the local:lastTimeEndedTask
	startTime: string; // ISO 8601 date string
	autoFocusDescription?: boolean;
	taskCreateDefaultValue?: Partial<ICreateTask>;
	clickCardToCopy?: keyof ICreateTask | null;
}