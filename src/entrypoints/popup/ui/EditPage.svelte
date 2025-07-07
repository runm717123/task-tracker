<script lang="ts">
	import '@bios-ui/core/css';
	import { Button, Input, InputLabel, TextArea } from '@bios-ui/svelte';
	import dayjs from 'dayjs';
	import FormHeader from '../../../lib/components/popup/FormHeader.svelte';

	interface Props {
		task: ITrackedTask;
		onSave: (updatedTask: ITrackedTask) => void;
		onCancel: () => void;
	}

	let { task, onSave, onCancel }: Props = $props();

	let title = $state(task.title);
	let description = $state(task.description);
	let startTime = $state(task.start ? dayjs(task.start).format('YYYY-MM-DDTHH:mm') : '');
	let endTime = $state(task.end ? dayjs(task.end).format('YYYY-MM-DDTHH:mm') : '');

	const handleSave = () => {
		const updatedTask: ITrackedTask = {
			...task,
			title,
			description,
			start: startTime ? dayjs(startTime).toISOString() : null,
			end: endTime ? dayjs(endTime).toISOString() : null,
		};
		onSave(updatedTask);
	};

	const canSave = $derived(title.trim().length > 0);
</script>

<main class="w-80 !p-3 bg-bg-dark">
	<FormHeader title="EDIT TASK" onBack={onCancel} />

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
			Start Time
			<Input id="startTime" type="datetime-local" bind:value={startTime} />
		</InputLabel>

		<InputLabel size="sm" className="flex flex-col gap-1">
			End Time
			<Input id="endTime" type="datetime-local" bind:value={endTime} />
		</InputLabel>

		<div class="flex gap-2 pt-2">
			<Button onclick={onCancel} size="md" className="flex-1">Cancel</Button>
			<Button onclick={handleSave} size="md" disabled={!canSave} className="flex-1">Save</Button>
		</div>
	</div>
</main>
