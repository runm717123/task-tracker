interface ITrackedTask {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'in-progress' | 'completed';
	createdAt: string;
}