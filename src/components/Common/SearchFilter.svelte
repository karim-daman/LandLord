<script lang="ts">
	import { filter, search } from '../Icons/icons';

	export let searchTerm: string;
	export let onSearchChange: (term: string) => void;
	export let filterOptions: { value: string; label: string }[] | undefined;
	export let filterValue: string | undefined;
	export let onFilterChange: ((value: string) => void) | undefined;
	export let placeholder = 'Search...';
</script>

<div class="mb-1 flex flex-col gap-4 sm:flex-row">
	<div class="relative flex-1">
		{@html search}
		<input
			type="text"
			{placeholder}
			bind:value={searchTerm}
			on:input={(e) => onSearchChange((e.target as HTMLInputElement)?.value || '')}
			class="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	{#if filterOptions && onFilterChange}
		<div class="relative">
			{@html filter}
			<select
				bind:value={filterValue}
				on:change={(e) => onFilterChange((e.target as HTMLInputElement)?.value || '')}
				class="rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
				<option value="">All</option>
				{#each filterOptions as option (option.value)}
					<option value={option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		</div>
	{/if}
</div>
