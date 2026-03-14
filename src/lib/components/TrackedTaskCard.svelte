<script lang="ts">
	import { ClockAlert, PlayIcon, EditIcon, XIcon } from '@lucide/svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);

	const { task, onEdit, onDelete, onResume } = $props<{
		task: ITrackedTask;
		onEdit: (task: ITrackedTask) => void;
		onDelete: (taskId: string) => void;
		onResume: (task: ITrackedTask) => void;
	}>();

	// Local time helpers
	const getTimeRange = (start: string | null, end: string | null) => {
		if (!start || !end) return null;
		const startDate = dayjs(start);
		const endDate = dayjs(end);
		if (endDate.isBefore(startDate)) return null;
		return `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`;
	};

	const getRelativeTime = (date: string) => dayjs(date).fromNow();

	// Local copied state
	let copied = $state(new Set<string>());

	const copyToClipboard = async (text: string, taskId: string, field: keyof ITrackedTask) => {
		try {
			await navigator.clipboard.writeText(text);
			copied.add(`${taskId}-${field}`);
			// Force reactivity by reassigning
			copied = new Set(copied);
			setTimeout(() => {
				copied.delete(`${taskId}-${field}`);
				// Force reactivity by reassigning
				copied = new Set(copied);
			}, 3000);
		} catch (e) {
			console.error('Copy failed', e);
		}
	};

	const handleTimeRangeCopy = () => {
		const tr = getTimeRange(task.start, task.end) || '';
		if (tr) copyToClipboard(tr, task.id, 'start');
	};

	const handleFieldClick = (field: keyof ITrackedTask) => {
		const val = task[field];
		if (typeof val === 'string' && val) copyToClipboard(val, task.id, field);
	};

	const getDisplayText = (field: keyof ITrackedTask, text: string) => {
		if (!text) return '';
		const isCopied = copied.has(`${task.id}-${field}`);
		return isCopied ? `${text} (copied)` : text;
	};
</script>

<div class="bg-bg-darker border border-border rounded-lg p-3 hover:bg-bg-light transition-colors">
	<div class="flex flex-col items-start justify-between">
		<div class="flex items-center justify-between w-full mb-1">
			<div class="flex items-center">
				{#if getTimeRange(task.start, task.end)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div role="button" tabindex="0" class="text-accent-primary text-sm font-medium bg-accent-primary/10 px-2 py-0.5 rounded whitespace-nowrap" onclick={handleTimeRangeCopy} title="Click to copy time range">
						{getDisplayText('start', getTimeRange(task.start, task.end) || '')}
					</div>
				{:else}
					<ClockAlert class="text-fg-dark mr-4" size={16} />
				{/if}
			</div>
			<div class="flex items-center gap-1 flex-shrink-0">
				<button class="p-1 text-fg-muted hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" onclick={() => onResume(task)} title="Resume task (duplicate with current time)">
					<PlayIcon size={15} />
				</button>
				<button class="p-1 text-fg-muted hover:text-fg-dark hover:bg-blue-50 rounded-md transition-colors" onclick={() => onEdit(task)} title="Edit task">
					<EditIcon size={16} />
				</button>
				<button class="p-1 text-fg-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onclick={() => onDelete(task.id)} title="Delete task">
					<XIcon size={16} />
				</button>
			</div>
		</div>

		<div role="button" tabindex="0" class="font-semibold text-base text-fg-dark truncate mr-4 text-left w-full" onclick={() => handleFieldClick('title')} onkeydown={(e) => e.key === 'Enter' && handleFieldClick('title')} title="Click to copy title">
			{getDisplayText('title', task.title)}
		</div>

		<div
			role="button"
			tabindex="0"
			class="text-fg-muted text-xs mb-1 leading-relaxed line-clamp-3 text-left w-full whitespace-pre-wrap"
			onclick={() => handleFieldClick('description')}
			onkeydown={(e) => e.key === 'Enter' && handleFieldClick('description')}
			title="Click to copy description"
		>
			{getDisplayText('description', task.description)}
		</div>

		<div class="text-xs text-fg-muted">
			<div
				role="button"
				tabindex="0"
				class="text-xs text-fg-muted"
				onclick={() => copyToClipboard(getRelativeTime(task.createdAt), task.id, 'createdAt')}
				onkeydown={(e) => e.key === 'Enter' && copyToClipboard(getRelativeTime(task.createdAt), task.id, 'createdAt')}
				title="Click to copy created time"
			>
				Created {getDisplayText('createdAt', getRelativeTime(task.createdAt))}
			</div>
		</div>
	</div>
</div>

<style>
	/* No extra styles; styling handled via Tailwind + design tokens */
</style>
