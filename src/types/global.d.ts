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

interface ICreateTask extends ITask {
	start?: string | null; // ISO 8601 date string - optional start time
	end?: string | null; // ISO 8601 date string - optional end time
}

interface ISettings {
	// when the user usually starts working
	// this will initialize the local:lastTimeEndedTask
	startTime: string; // ISO 8601 date string
	autoFocusDescription?: boolean;
	taskCreateDefaultValue?: Partial<ICreateTask>;
}

interface ISummaryGroup {
	title: string;
	tasks: string[];
}

interface IParsedTask {
	title: string;
	description: string;
}

interface ITaskWithParsedDescription extends IParsedTask {
	descriptionItems: string[];
}

type TTasksMap = Map<string, string[]>;

// Environment variable typing for import.meta.env
interface ImportMetaEnv {
	readonly WXT_ENV: 'dev' | 'test' | 'prod';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
