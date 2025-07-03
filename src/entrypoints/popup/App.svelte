<script lang="ts">
	import '@bios-ui/core/css';
	import { XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '../../lib/stores/taskStore';
	import EditPage from './ui/EditPage.svelte';

	let tasks: ITrackedTask[] = $state([]);
	let currentView: 'list' | 'edit' = $state('list');
	let editingTask: ITrackedTask | null = $state(null);
	let isLoading = $state(true);

	let unwatch: () => void;

	onMount(async () => {
		// Initialize storage with mock data if needed
		await taskStore.initializeStorage();
		
		// Load initial tasks
		tasks = await taskStore.getTasks();
		isLoading = false;

		// Watch for changes in storage
		unwatch = taskStore.watchTasks((newTasks) => {
			tasks = newTasks;
		});

		// Add keydown event listener for ESC key
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (currentView === 'edit') {
					cancelEdit();
				} else {
					window.close();
				}
			}
		};

		document.addEventListener('keydown', handleKeydown);

		// Cleanup function
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(() => {
		if (unwatch) unwatch();
	});

	const deleteTask = async (taskId: string) => {
		await taskStore.deleteTask(taskId);
	};

	const editTask = (task: ITrackedTask) => {
		editingTask = task;
		currentView = 'edit';
	};

	const saveTask = async (updatedTask: ITrackedTask) => {
		await taskStore.updateTask(updatedTask);
		currentView = 'list';
		editingTask = null;
	};

	const cancelEdit = () => {
		currentView = 'list';
		editingTask = null;
	};
</script>

{#if currentView === 'list'}
	<main class="w-80 p-4 bg-bg-dark">
		<h1 class="text-xl font-bold mb-4 text-fg-dark">Task Tracker</h1>

		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="w-6 h-6 border-2 border-fg-dark border-t-transparent rounded-full animate-spin"></div>
			</div>
		{:else}
			<div class="space-y-1 overflow-y-auto" role="list">
				{#each tasks as task (task.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div role="listitem" class="border border-border rounded-md p-2 bg-bg-darker hover:bg-bg-light transition-colors cursor-pointer" onclick={() => editTask(task)}>
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0 mr-3">
								<h3 class="font-medium text-sm text-left text-fg-dark truncate">{task.title}</h3>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<span class="text-xs text-fg-muted">
									{dayjs(task.createdAt).format('HH:mm')}
								</span>
								<XIcon
									role="button"
									size={16}
									class="text-fg-muted hover:text-fg-dark cursor-pointer"
									onclick={(e) => {
										e.stopPropagation();
										deleteTask(task.id);
									}}
								/>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if tasks.length === 0}
				<div class="text-center py-8 text-fg-dark">
					<p class="text-sm">No tasks found</p>
				</div>
			{/if}
		{/if}
	</main>
{:else if currentView === 'edit' && editingTask}
	<EditPage task={editingTask} onSave={saveTask} onCancel={cancelEdit} />
{/if}
