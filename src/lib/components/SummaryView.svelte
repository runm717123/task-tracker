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
		<ol class="space-y-1 list-decimal list-inside">
			{#each items as item}
				<li class="text-fg-dark text-sm leading-relaxed">{item}</li>
			{/each}
		</ol>
	{:else}
		<div class="text-center py-8">
			<p class="text-fg-muted text-sm">{emptyMessage}</p>
		</div>
	{/if}
</div>
