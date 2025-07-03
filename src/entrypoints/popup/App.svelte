<script lang="ts">
	import '@bios-ui/core/css';
	import { XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { mockTasks } from '../../mocks/tasks';
	import EditPage from './ui/EditPage.svelte';

	// svelte-ignore non_reactive_update
let tasks: ITrackedTask[] = mockTasks;
	let currentView: 'list' | 'edit' = $state('list');
	let editingTask: ITrackedTask | null = $state(null);

	const deleteTask = (taskId: string) => {
		tasks = tasks.filter((task) => task.id !== taskId);
	};

	const editTask = (task: ITrackedTask) => {
		editingTask = task;
		currentView = 'edit';
	};

	const saveTask = (updatedTask: ITrackedTask) => {
		tasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
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
	</main>
{:else if currentView === 'edit' && editingTask}
	<EditPage task={editingTask} onSave={saveTask} onCancel={cancelEdit} />
{/if}
