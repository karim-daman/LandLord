<script lang="ts">
	export let searchTerm: string;
	export let onSearchChange: (term: string) => void;
	export let filterOptions: { value: string; label: string }[] | undefined;
	export let filterValue: string | undefined;
	export let onFilterChange: ((value: string) => void) | undefined;
	export let placeholder = 'Search...';
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row">
	<div class="relative flex-1">
		<!-- Search Icon -->
		<svg
			class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			{placeholder}
			bind:value={searchTerm}
			on:input={(e) => onSearchChange(e.target.value)}
			class="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	{#if filterOptions && onFilterChange}
		<div class="relative">
			<!-- Filter Icon -->
			<svg
				class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
				/>
			</svg>
			<select
				bind:value={filterValue}
				on:change={(e) => onFilterChange(e.target.value)}
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
