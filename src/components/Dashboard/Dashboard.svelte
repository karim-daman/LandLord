<script lang="ts">
	import { formatCurrency } from '../../utils/helpers';
	import type { Client, Property, LeaseAgreement } from '../../types';

	export let clients: Client[];
	export let properties: Property[];
	export let leases: LeaseAgreement[];

	const building2 =
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building2-icon lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>';
	const users = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>`;
	const fileText = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
	const money = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dollar-sign-icon lucide-circle-dollar-sign"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>`;

	$: activeLeases = Array.isArray(leases)
		? leases.filter((lease) => lease.status === 'active')
		: [];
	$: availableProperties = Array.isArray(properties)
		? properties.filter((prop) => prop.isAvailable)
		: [];
	$: totalMonthlyRevenue = Array.isArray(activeLeases)
		? activeLeases.reduce((total, lease) => total + lease.monthlyRent, 0)
		: 0;
	$: expiringLeases = Array.isArray(leases)
		? leases.filter((lease) => {
				const endDate = new Date(lease.endDate);
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
				return endDate <= thirtyDaysFromNow && lease.status === 'active';
			})
		: [];

	// Reactive declaration for stats array
	$: stats = [
		{
			title: 'Total Clients',
			value: Array.isArray(clients) ? clients.length.toString() : '0',
			icon: users,
			color: 'text-blue-600',
			bgColor: 'bg-blue-100'
		},
		{
			title: 'Total Properties',
			value: Array.isArray(properties) ? properties.length.toString() : '0',
			icon: building2,
			color: 'text-teal-600',
			bgColor: 'bg-teal-100'
		},
		{
			title: 'Active Leases',
			value: activeLeases.length.toString(),
			icon: fileText,
			color: 'text-green-600',
			bgColor: 'bg-green-100'
		},
		{
			title: 'Monthly Revenue',
			value: formatCurrency(totalMonthlyRevenue),
			icon: money,
			color: 'text-orange-600',
			bgColor: 'bg-orange-100'
		}
	];

	// Reactive declaration for recent activity
	$: recentActivity = [
		...(Array.isArray(clients) ? clients : []),
		...(Array.isArray(properties) ? properties : []),
		...(Array.isArray(leases) ? leases : [])
	]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);
</script>

<div class="space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat, index (index)}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">{stat.title}</p>
						<p class="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
					</div>
					<div class={`${stat.bgColor} rounded-lg p-3`}>
						<span class={`text-xl ${stat.color}`}>{@html stat.icon}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Quick Actions & Alerts -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Quick Overview</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Available Properties</span>
					<span class="text-sm font-medium text-teal-600">{availableProperties.length}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Pending Leases</span>
					<span class="text-sm font-medium text-yellow-600">
						{Array.isArray(leases) ? leases.filter((l) => l.status === 'pending').length : 0}
					</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Expired Leases</span>
					<span class="text-sm font-medium text-red-600">
						{Array.isArray(leases) ? leases.filter((l) => l.status === 'expired').length : 0}
					</span>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center space-x-2">
				<span class="text-xl text-orange-600">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-calendar-days-icon lucide-calendar-days"
						><path d="M8 2v4" /><path d="M16 2v4" /><rect
							width="18"
							height="18"
							x="3"
							y="4"
							rx="2"
						/><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path
							d="M16 14h.01"
						/><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg
					>
				</span>
				<h3 class="text-lg font-semibold text-gray-900">Expiring Soon</h3>
			</div>
			{#if expiringLeases.length > 0}
				<div class="space-y-3">
					{#each expiringLeases.slice(0, 3) as lease (lease.id)}
						<!-- We can't use #const, so we do the lookups inside the template -->
						<div
							class="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
						>
							<div>
								<p class="text-sm font-medium text-gray-900">
									{Array.isArray(clients)
										? clients.find((c) => c.id === lease.clientId)?.firstName
										: 'Unknown'}
									{Array.isArray(clients)
										? clients.find((c) => c.id === lease.clientId)?.lastName
										: 'Client'}
								</p>
								<p class="text-xs text-gray-600">
									{Array.isArray(properties)
										? properties.find((p) => p.id === lease.propertyId)?.address
										: 'Unknown Property'}
								</p>
							</div>
							<div class="text-right">
								<p class="text-xs font-medium text-orange-600">
									Expires {new Date(lease.endDate).toLocaleDateString()}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500">No leases expiring in the next 30 days</p>
			{/if}
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-4 flex items-center space-x-2">
			<span class="text-xl text-blue-600">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-activity-icon lucide-activity"
					><path
						d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
					/></svg
				>
			</span>
			<h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
		</div>
		<div class="space-y-3">
			{#each recentActivity as item, index (index)}
				<!-- We can't use #const, so we use the logic directly in the template -->
				<div class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
					<div
						class={`rounded-full p-2 ${
							'firstName' in item
								? 'bg-blue-100'
								: 'address' in item && !('clientId' in item)
									? 'bg-teal-100'
									: 'bg-green-100'
						}`}
					>
						{#if 'firstName' in item}
							<span class="text-blue-600">👥</span>
						{:else if 'address' in item && !('clientId' in item)}
							<span class="text-teal-600">🏢</span>
						{:else}
							<span class="text-green-600">📝</span>
						{/if}
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">
							{#if 'firstName' in item}
								New client: {(item as Client).firstName} {(item as Client).lastName}
							{:else if 'address' in item && !('clientId' in item)}
								New property: {(item as Property).address}
							{:else}
								New lease agreement created
							{/if}
						</p>
						<p class="text-xs text-gray-500">
							{new Date(item.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
