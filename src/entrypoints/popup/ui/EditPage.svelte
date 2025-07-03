<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Input, InputLabel, TextArea } from '@bios-ui/svelte';
	import { ArrowLeftIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';

	interface Props {
		task: ITrackedTask;
		onSave: (updatedTask: ITrackedTask) => void;
		onCancel: () => void;
	}

	let { task, onSave, onCancel }: Props = $props();

	let title = $state(task.title);
	let description = $state(task.description);
	let createdAt = $state(dayjs(task.createdAt).format('YYYY-MM-DDTHH:mm'));

	const handleSave = () => {
		const updatedTask: ITrackedTask = {
			...task,
			title,
			description,
			createdAt: dayjs(createdAt).toISOString(),
		};
		onSave(updatedTask);
	};

	const canSave = $derived(title.trim().length > 0);
</script>

<main class="w-80 p-4 bg-bg-dark">
	<div class="flex flex-col items-start mb-4">
		<button class="flex items-center gap-2 text-fg-muted hover:text-fg-dark transition-colors flex-1" onclick={onCancel}>
			<ArrowLeftIcon size={16} />
			<span class="text-sm">Back</span>
		</button>
		<h1 class="text-xl font-semibold self-center text-fg-dark text-center font-family-heading">EDIT TASK</h1>
	</div>

	<div class="flex flex-col gap-4">
		<InputLabel size="sm" className="flex flex-col gap-1">
			Title
			<Input id="title" bind:value={title} placeholder="Enter task title" />
		</InputLabel>

		<InputLabel size="sm" className="flex flex-col gap-1">
			Description
			<TextArea id="description" bind:value={description} rows={3} placeholder="Enter task description" />
		</InputLabel>

		<InputLabel size="sm" className="flex flex-col gap-1">
			Date & Time
			<Input id="createdAt" type="datetime-local" bind:value={createdAt} />
		</InputLabel>

		<div class="flex gap-2 pt-2">
			<Button onclick={onCancel} size="md" className="flex-1">Cancel</Button>
			<Button onclick={handleSave} size="md" disabled={!canSave} className="flex-1">Save</Button>
		</div>
	</div>
</main>
