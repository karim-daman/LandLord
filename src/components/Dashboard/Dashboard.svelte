<script lang="ts">
	import { formatCurrency } from '../../utils/helpers';
	import type { Tenant, Property, LeaseAgreement } from '../../types';

	import { building2, users, fileText, money, activity, calendar } from '../Icons/icons';

	export let tenants: Tenant[];
	export let properties: Property[];
	export let leases: LeaseAgreement[];

	$: activeLeases = Array.isArray(leases)
		? leases.filter((lease) => lease.status === 'active')
		: [];

	// Fixed calculation: determine availability based on active leases, not unit.isAvailable
	$: availableUnits = properties
		? properties.reduce((count, property) => {
				if (!property.units) return count;

				return (
					count +
					property.units.filter((unit) => {
						// Check if this unit has an active lease
						const hasActiveLease = Array.isArray(leases)
							? leases.some(
									(lease) =>
										lease.propertyId === property.id &&
										lease.unitId === unit.id &&
										lease.status === 'active'
								)
							: false;

						// Unit is available if it doesn't have an active lease
						return !hasActiveLease;
					}).length
				);
			}, 0)
		: 0;

	$: totalUnits = Array.isArray(properties)
		? properties.reduce((count, property) => {
				return count + (property.units ? property.units.length : 0);
			}, 0)
		: 0;

	$: occupiedUnits = totalUnits - availableUnits;

	$: totalMonthlyRevenue = Array.isArray(activeLeases)
		? activeLeases.reduce((total, lease) => total + lease.monthlyRent, 0)
		: 0;

	// Fixed: Check if lease expires within 30 days and is currently active
	$: expiringLeases = Array.isArray(leases)
		? leases.filter((lease) => {
				if (lease.status !== 'active') return false;

				const endDate = new Date(lease.endDate);
				const today = new Date();
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(today.getDate() + 30);

				return endDate <= thirtyDaysFromNow && endDate > today;
			})
		: [];

	// Fixed: Only count leases that have actually expired (past end date) and have expired status
	$: expiredLeases = Array.isArray(leases)
		? leases.filter((lease) => {
				const endDate = new Date(lease.endDate);
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				endDate.setHours(0, 0, 0, 0);

				// Count leases that are past their end date OR have expired/terminated status
				return (
					endDate.getTime() < today.getTime() ||
					lease.status === 'expired' ||
					lease.status === 'terminated'
				);
			})
		: [];

	$: stats = [
		{
			title: 'Total Tenants',
			value: Array.isArray(tenants) ? tenants.length.toString() : '0',
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
		...(Array.isArray(tenants) ? tenants : []),
		...(Array.isArray(properties) ? properties : []),
		...(Array.isArray(leases) ? leases : [])
	]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	function getTenantName(tenantId: string): string {
		if (!Array.isArray(tenants)) return 'Unknown Tenant';
		const tenant = tenants.find((t) => t.id === tenantId);
		return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant';
	}

	function getPropertyAddress(propertyId: string, unitId?: string): string {
		if (!Array.isArray(properties)) return 'Unknown Property';
		const property = properties.find((p) => p.id === propertyId);
		if (!property) return 'Unknown Property';

		if (unitId && property.units) {
			const unit = property.units.find((u) => u.id === unitId);
			const unitNumber = unit ? ` - Unit ${unit.unitNumber}` : '';
			return `${property.address}${unitNumber}`;
		}

		return property.address;
	}
</script>

<div class="space-y-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat, index (index)}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-medium text-gray-600">{stat.title}</p>
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
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Unit Overview</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Total Units</span>
					<span class="text-xs font-medium text-gray-900">{totalUnits}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Available Units</span>
					<span class="text-xs font-medium text-teal-600">{availableUnits}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Occupied Units</span>
					<span class="text-xs font-medium text-blue-600">{occupiedUnits}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Occupancy Rate</span>
					<span class="text-xs font-medium text-green-600">
						{totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%
					</span>
				</div>
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Lease Status</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Active Leases</span>
					<span class="text-xs font-medium text-green-600">{activeLeases.length}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Pending Leases</span>
					<span class="text-xs font-medium text-yellow-600">
						{Array.isArray(leases) ? leases.filter((l) => l.status === 'pending').length : 0}
					</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Expired Leases</span>
					<span class="text-xs font-medium text-red-600">{expiredLeases.length}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-600">Expiring Soon (30 days)</span>
					<span class="text-xs font-medium text-orange-600">{expiringLeases.length}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Expiring Leases Alert -->
	{#if expiringLeases.length > 0}
		<div class="rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm">
			<div class="mb-4 flex items-center space-x-2">
				<span class="text-xl text-orange-600">
					{@html calendar}
				</span>
				<h3 class="text-lg font-semibold text-gray-900">Leases Expiring Soon</h3>
			</div>
			<div class="space-y-3">
				{#each expiringLeases.slice(0, 5) as lease (lease.id)}
					<div
						class="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-3"
					>
						<div>
							<p class="text-sm font-medium text-gray-900">
								{getTenantName(lease.tenantId)}
							</p>
							<p class="text-xs text-gray-600">
								{getPropertyAddress(lease.propertyId, lease.unitId)}
							</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium text-orange-600">
								Expires {new Date(lease.endDate).toLocaleDateString()}
							</p>
							<p class="text-xs text-gray-500">
								{Math.ceil(
									(new Date(lease.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
								)} days remaining
							</p>
						</div>
					</div>
				{/each}
				{#if expiringLeases.length > 5}
					<p class="text-center text-xs text-gray-500">
						... and {expiringLeases.length - 5} more
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Recent Activity -->
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-4 flex items-center space-x-2">
			<span class="text-xl text-blue-600">
				{@html activity}
			</span>
			<h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
		</div>
		<div class="space-y-3">
			{#each recentActivity as item, index (index)}
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
							<span class="text-blue-600">
								{@html users}
							</span>
						{:else if 'address' in item && !('clientId' in item)}
							<span class="text-teal-600">
								{@html building2}
							</span>
						{:else}
							<span class="text-green-600">{@html fileText}</span>
						{/if}
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">
							{#if 'firstName' in item}
								New tenant: {(item as Tenant).firstName} {(item as Tenant).lastName}
							{:else if 'address' in item && !('clientId' in item)}
								New property: {(item as Property).name || (item as Property).address}
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
			{#if recentActivity.length === 0}
				<p class="py-4 text-center text-sm text-gray-500">No recent activity</p>
			{/if}
		</div>
	</div>
</div>
