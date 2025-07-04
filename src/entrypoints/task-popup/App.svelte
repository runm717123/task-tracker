<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Input, InputLabel, TextArea } from '@bios-ui/svelte';
	import { NotebookPenIcon } from '@lucide/svelte';
	import { taskStore } from '../../lib/stores/taskStore';

	let taskTitle = $state('');
	let taskDescription = $state('');
	let isLoading = $state(false);

	const handleSave = async () => {
		if (!taskTitle.trim()) return;

		isLoading = true;
		try {
			const currentTime = new Date().toISOString();
			const newTask: ITrackedTask = {
				id: crypto.randomUUID(),
				title: taskTitle.trim(),
				description: taskDescription.trim(),
				status: 'pending',
				createdAt: currentTime,
				start: currentTime,
				end: currentTime,
			};

			await taskStore.addTask(newTask);

			// Clear inputs and close
			taskTitle = '';
			taskDescription = '';
			window.close();
		} catch (error) {
			console.error('Failed to save task:', error);
		} finally {
			isLoading = false;
		}
	};

	const handleCancel = () => {
		window.close();
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			handleCancel();
		}
	};
</script>

<main class="!px-3 !py-2 bg-bg-dark">
	<div class="flex flex-col h-full">
		<div class="flex items-center gap-3 mb-4">
			<div class="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center">
				<NotebookPenIcon class="" />
			</div>
			<div>
				<h1 class="text-lg font-semibold text-fg-dark">Add New Task</h1>
				<p class="text-fg-muted text-xs">What you have done?</p>
			</div>
		</div>

		<div class="flex-1 flex flex-col gap-4">
			<div>
				<InputLabel size="sm" className="flex flex-col gap-1">
					Title
					<Input autofocus required bind:value={taskTitle} onkeydown={handleKeydown} placeholder="Enter task title..." className="w-full" />
				</InputLabel>
			</div>

			<div class="flex-1">
				<InputLabel size="sm" className="flex flex-col gap-1">
					Description
					<TextArea id="task-description-input" bind:value={taskDescription} onkeydown={handleKeydown} rows="2" placeholder="Enter your task description..." className="w-full resize-none" />
				</InputLabel>
			</div>

			<div class="flex gap-3">
				<Button onclick={handleSave} disabled={!taskTitle.trim() || isLoading} className="flex-1">
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-fg-on-accent border-t-transparent rounded-full animate-spin"></div>
							Saving...
						</div>
					{:else}
						Save Task
					{/if}
				</Button>

				<Button onclick={handleCancel} variant="secondary" className="flex-1">Cancel</Button>
			</div>

			<div class="text-center">
				<p class="text-xs text-fg-muted">
					Press <kbd class="px-1 py-0.5 text-xs bg-bg-muted rounded">Enter</kbd> to save or <kbd class="px-1 py-0.5 text-xs bg-bg-muted rounded">Esc</kbd> to cancel
				</p>
			</div>
		</div>
	</div>
</main>
