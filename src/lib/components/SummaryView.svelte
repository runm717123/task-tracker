<script lang="ts">
	interface Props {
		items: string[];
		title?: string;
		emptyMessage?: string;
		className?: string;
	}

	let { items, title = 'Summary', emptyMessage = 'No items to display', className = '' }: Props = $props();
</script>

<div class="summary-view {className}">
	{#if title}
		<h3 class="text-lg font-semibold text-fg-dark mb-3 font-family-heading">{title}</h3>
	{/if}

	{#if items.length > 0}
		<div class="space-y-2">
			{#each items as item, index}
				<div class="flex items-start gap-3 p-3 bg-bg-muted rounded-lg border border-border">
					<div class="flex-shrink-0 w-6 h-6 bg-accent text-fg-on-accent rounded-full flex items-center justify-center text-sm font-medium">
						{index + 1}
					</div>
					<p class="text-fg-dark text-sm leading-relaxed flex-1">{item}</p>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-fg-muted text-sm">{emptyMessage}</p>
		</div>
	{/if}
</div>
