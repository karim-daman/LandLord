<script lang="ts">
	import { building2, chart, users, fileText } from '../Icons/icons';
	import About from '../Common/About.svelte';

	export let activeTab: string;
	export let setActiveTab: (tab: string) => void = (tab) => {
		console.warn('setActiveTab not provided, default implementation used');
		activeTab = tab;
	};

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard', icon: chart },
		{ id: 'tenants', label: 'Tenants', icon: users },
		{ id: 'properties', label: 'Properties', icon: building2 },
		{ id: 'leases', label: 'Agreements', icon: fileText }
	];
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<nav class="hidden space-x-1 md:flex">
				{#each tabs as tab (tab.id)}
					<button
						on:click={() => setActiveTab(tab.id)}
						class={`flex w-[150px] items-center space-x-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
							activeTab === tab.id
								? 'border border-blue-200 bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
						}`}
					>
						<span class="text-base">
							{@html tab.icon}
						</span>
						<span>{tab.label}</span>
					</button>
				{/each}
			</nav>

			<div class="flex items-center">
				<div class="hidden md:block">
					<About />
				</div>
				<div class="flex items-center space-x-2 md:hidden">
					<select
						bind:value={activeTab}
						on:change={(e) => setActiveTab((e.currentTarget as HTMLSelectElement).value)}
						class="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						{#each tabs as tab (tab.id)}
							<option value={tab.id}>{tab.label}</option>
						{/each}
					</select>
					<About />
				</div>
			</div>
		</div>
	</div>
</header>
