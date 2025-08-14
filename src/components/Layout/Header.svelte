<script lang="ts">
	export let activeTab: string;
	export let setActiveTab: (tab: string) => void = (tab) => {
		console.warn('setActiveTab not provided, default implementation used');
		activeTab = tab;
	};

	const building2 =
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2-icon lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
	const users = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>`;
	const fileText = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
	const chart = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-spline-icon lucide-chart-spline"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7"/></svg>`;

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard', icon: chart },
		{ id: 'clients', label: 'Clients', icon: users },
		{ id: 'properties', label: 'Properties', icon: building2 },
		{ id: 'leases', label: 'Lease Agreements', icon: fileText }
	];
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center space-x-2">
				<!-- <span class="text-2xl"> {@html home}</span> -->
				<h1 class="text-xl font-bold text-gray-900">LeaseTracker Pro</h1>
			</div>

			<nav class="hidden space-x-1 md:flex">
				{#each tabs as tab (tab.id)}
					<button
						on:click={() => setActiveTab(tab.id)}
						class={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === tab.id
								? 'border border-blue-200 bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
						}`}
					>
						<!-- Fix applied here: Use @html for the SVG icon -->
						<span class="text-base">
							{#if tab.icon.startsWith('<svg')}
								{@html tab.icon}
							{:else}
								{tab.icon}
							{/if}
						</span>
						<span>{tab.label}</span>
					</button>
				{/each}
			</nav>

			<div class="md:hidden">
				<select
					bind:value={activeTab}
					on:change={(e) => setActiveTab((e.currentTarget as HTMLSelectElement).value)}
					class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>
					{#each tabs as tab (tab.id)}
						<option value={tab.id}>{tab.label}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</header>
