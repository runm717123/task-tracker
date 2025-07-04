<script lang="ts">
	import '@bios-ui/core/css';
	import { XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '../../lib/stores/taskStore';

	dayjs.extend(relativeTime);

	let tasks: ITrackedTask[] = $state([]);
	let isLoading = $state(true);

	let unwatch: () => void;

	onMount(() => {
		const initializeStorage = async () => {
			// Initialize storage with mock data if needed
			await taskStore.initializeStorage();

			// Load initial tasks
			tasks = await taskStore.getTasks();
			isLoading = false;

			// Watch for changes in storage
			unwatch = taskStore.watchTasks((newTasks) => {
				tasks = newTasks;
			});
		};

		initializeStorage();
	});

	onDestroy(() => {
		if (unwatch) unwatch();
	});

	const deleteTask = async (taskId: string) => {
		await taskStore.deleteTask(taskId);
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'in-progress':
				return 'In Progress';
			case 'done':
				return 'Done';
			case 'pending':
				return 'Pending';
			default:
				return status;
		}
	};

	const getTimeRange = (start: string | null, end: string | null) => {
		if (!start || !end) return null;

		const startDate = dayjs(start);
		const endDate = dayjs(end);

		// Make sure end time is after start time
		if (endDate.isBefore(startDate)) return null;

		return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;
	};

	const getRelativeTime = (dateString: string) => {
		return dayjs(dateString).fromNow();
	};
</script>

<main class="min-h-screen overflow-y-auto bg-bg-dark p-4">
	<div class="text-center mb-6 font-family-heading">
		<h1 class="text-2xl font-bold text-fg-dark">Task Summary</h1>
		<span class="text-fg-muted text-sm">Total Tasks: {tasks.length}</span>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="w-8 h-8 border-2 border-fg-dark border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each tasks as task (task.id)}
				<div class="bg-bg-darker border border-border rounded-lg p-4 hover:bg-bg-light transition-colors">
					<div class="flex flex-col items-start justify-between">
						<div class="flex items-center justify-between w-full">
							<span class="text-accent-primary font-medium bg-accent-primary/10 py-1 rounded text-sm whitespace-nowrap">
								{task.status ? getStatusLabel(task.status) : ''}
							</span>
							<div class="flex items-center gap-2 flex-shrink-0">
								{#if getTimeRange(task.start, task.end)}
									<span class="text-accent-primary font-medium bg-accent-primary/10 px-2 py-1 rounded text-sm whitespace-nowrap">
										{getTimeRange(task.start, task.end)}
									</span>
								{/if}
								<button class="p-2 text-fg-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onclick={() => deleteTask(task.id)} title="Delete task">
									<XIcon size={20} />
								</button>
							</div>
						</div>

						<h3 class="font-semibold text-lg text-fg-dark truncate mr-4 mb-2">
							{task.title}
						</h3>

						<p class="text-fg-muted text-sm mb-2 leading-relaxed">{task.description}</p>

						<div class="text-xs text-fg-muted">
							<span>Created {getRelativeTime(task.createdAt)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if tasks.length === 0}
			<div class="text-center py-12">
				<p class="text-fg-muted">No tasks found</p>
			</div>
		{/if}
	{/if}
</main>
