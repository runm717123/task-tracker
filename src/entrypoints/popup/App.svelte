<script lang="ts">
	import '@bios-ui/core/css';
	import { Button } from '@bios-ui/svelte';
	import { ListCheckIcon, XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import { onMount, onDestroy } from 'svelte';
	import { taskStore } from '../../lib/stores/taskStore';
	import EditPage from './ui/EditPage.svelte';

	let tasks: ITrackedTask[] = $state([]);
	let currentView: 'list' | 'edit' = $state('list');
	let editingTask: ITrackedTask | null = $state(null);

	let unwatch: () => void;

	onMount(() => {
		const initializeStorage = async () => {
			// Initialize storage with mock data if needed
			// await taskStore.initializeStorage();

			// Load initial tasks
			tasks = await taskStore.getTasks();

			// Watch for changes in storage
			unwatch = taskStore.watchTasks((newTasks) => {
				tasks = newTasks;
			});
		};

		initializeStorage();

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

	let sidepanelOpen = $state(false);

	const toggleSidepanel = async () => {
		try {
			const currentWindow = await browser.windows.getCurrent();
			// Try to get current sidepanel state and toggle

			if (!sidepanelOpen && currentWindow.id) {
				await browser.sidePanel.open({ windowId: currentWindow.id });
				sidepanelOpen = true;
			} else {
				// not work yet, follow this issue to track:
				// https://github.com/w3c/webextensions/issues/521
				chrome.runtime.sendMessage('closeSidePanel');
				sidepanelOpen = false;
			}
		} catch (error) {
			console.error('Failed to toggle sidepanel:', error);
		}
	};
</script>

{#if currentView === 'list'}
	<main class="w-80 bg-bg-dark max-h-[480px] flex flex-col">
		<h1 class="text-xl font-bold mb-4 text-fg-dark flex flex-row gap-1 border-b border-[##979797] pb-1 pt-2 ml-3 flex-shrink-0">
			<ListCheckIcon />
			Task Tracker
		</h1>

		<div class="px-3 flex-1 flex flex-col min-h-0 mb-2">
			<div class="overflow-y-auto flex-1 min-h-0" role="list">
				{#each tasks as task (task.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div role="listitem" class="border-b border-border py-3 px-1 hover:bg-bg-light cursor-pointer group" onclick={() => editTask(task)}>
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0 mr-3">
								<h3 class="font-medium text-sm text-left text-fg-dark group-hover:text-white truncate">{task.title}</h3>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<span class="text-xs text-fg-muted group-hover:text-white">
									{dayjs(task.start).format('HH:mm')} -
									{dayjs(task.end).format('HH:mm')}
								</span>
								<XIcon
									role="button"
									size={16}
									class="text-fg-muted hover:text-red-500 cursor-pointer"
									onclick={(e) => {
										e.stopPropagation();
										deleteTask(task.id);
									}}
								/>
							</div>
						</div>
					</div>
				{/each}

				{#if tasks.length === 0}
					<div class="text-center py-8 text-fg-dark">
						<p class="text-sm mb-2">No tasks recorded yet</p>
						<p class="text-xs text-fg-muted mb-4">Create your first task to get started!</p>
						<div class="text-xs text-fg-muted space-y-1">
							<p>• Open sidepanel below</p>
							<p>• Use keyboard shortcut: <kbd class="bg-bg-light px-1 py-0.5 rounded text-xs">Alt+Up</kbd></p>
						</div>
					</div>
				{/if}
			</div>

			<div class="mt-4 flex flex-row justify-between items-center flex-shrink-0">
				{#if tasks.length > 0}
					<p class="text-sm text-fg-muted">
						Total Tasks: <span class="text-fg-dark">{tasks.length}</span>
					</p>
				{/if}
				<Button size="sm" onclick={toggleSidepanel}>Open Sidepanel</Button>
			</div>
		</div>
	</main>
{:else if currentView === 'edit' && editingTask}
	<EditPage task={editingTask} onSave={saveTask} onCancel={cancelEdit} />
{/if}
