<script lang="ts">
	import '@bios-ui/core/css';
	import { XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '../../lib/stores/taskStore';

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
			case 'completed':
				return 'Completed';
			case 'pending':
				return 'Pending';
			default:
				return status;
		}
	};
</script>

<main class="min-h-screen bg-bg-dark p-4">
	<div class="text-center mb-6 font-family-heading">
		<h1 class="text-2xl font-bold text-fg-dark">Task Summary</h1>
		<span class="text-fg-muted text-sm">Total Tasks: {tasks.length}</span>
		<span class="text-fg-muted text-xs">use the import button to download</span>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="w-8 h-8 border-2 border-fg-dark border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each tasks as task (task.id)}
				<div class="bg-bg-darker border border-border rounded-lg p-4 hover:bg-bg-light transition-colors">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<h3 class="font-semibold text-lg text-fg-dark">
									{task.title}
									{task.status ? ' - ' + getStatusLabel(task.status) : ''}
								</h3>
							</div>

							<p class="text-fg-muted text-sm mb-3 leading-relaxed">{task.description}</p>

							<div class="flex items-center text-xs text-fg-muted">
								<span>Created: {dayjs(task.createdAt).format('MMM DD, YYYY HH:mm')}</span>
							</div>
						</div>

						<button class="flex-shrink-0 ml-4 p-2 text-fg-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onclick={() => deleteTask(task.id)} title="Delete task">
							<XIcon size={20} />
						</button>
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
