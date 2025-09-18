<script lang="ts">
	import { initializeAllStores, tenants, properties, leaseAgreements as leases } from '$lib/stores';

	import toast from 'svelte-5-french-toast';
	import { onMount } from 'svelte';

	import Header from '../components/Layout/Header.svelte';
	import Dashboard from '../components/Dashboard/Dashboard.svelte';
	import ClientList from '../components/Clients/ClientList.svelte';
	import PropertyList from '../components/Properties/PropertyList.svelte';
	import LeaseList from '../components/Leases/LeaseList.svelte';
	import type { Tenant, Property, LeaseAgreement } from '../types';

	onMount(async () => {
		toast.promise(
			initializeAllStores().then((res) => {
				if (!res.success) throw new Error(res.message);

				// Update lease statuses based on end date
				leases.update((currentLeases) => {
					const currentDate = new Date();
					return currentLeases.map((lease) => {
						const endDate = new Date(lease.endDate);
						if (currentDate > endDate && lease.status === 'active') {
							// Update unit availability if lease is now expired
							properties.update((props) =>
								props.map((property) => {
									if (property.id === lease.propertyId && lease.unitId) {
										return {
											...property,
											units: property.units.map((unit) =>
												unit.id === lease.unitId ? { ...unit, isAvailable: true } : unit
											)
										};
									}
									return property;
								})
							);
							return { ...lease, status: 'expired' };
						}
						return lease;
					});
				});

				return res.message;
			}),
			{
				loading: 'Initializing stores...',
				success: (message) => message,
				error: (err) => err.message
			},
			{
				position: 'bottom-right'
			}
		);
	});

	let activeTab = 'dashboard';

	function handleCreateTenant(tenant: Tenant) {
		tenants.update((prev) => [...prev, tenant]);

		toast.success('Created Tenant', {
			position: 'bottom-right'
		});
	}

	function handleUpdateTenant(updatedTenant: Tenant) {
		tenants.update((prev) =>
			prev.map((tenant) => (tenant.id === updatedTenant.id ? updatedTenant : tenant))
		);
		toast.success('Updated Tenant', {
			position: 'bottom-right'
		});
	}

	function handleDeleteTenant(tenantId: string) {
		tenants.update((prev) => prev.filter((tenant) => tenant.id !== tenantId));
		// Also remove any leases associated with this tenant
		leases.update((prev) => {
			const tenantLeases = prev.filter((lease) => lease.clientId === tenantId);

			// Make units available again when tenant is deleted
			if (tenantLeases.length > 0) {
				properties.update((props) =>
					props.map((property) => ({
						...property,
						units: property.units.map((unit) => {
							const hasLease = tenantLeases.some(
								(lease) => lease.propertyId === property.id && lease.unitId === unit.id
							);
							return hasLease ? { ...unit, isAvailable: true } : unit;
						})
					}))
				);
			}

			return prev.filter((lease) => lease.clientId !== tenantId);
		});

		toast.success('Deleted Tenant', {
			position: 'bottom-right'
		});
	}

	function handleCreateProperty(property: Property) {
		properties.update((prev) => [...prev, property]);

		toast.success('Created Property', {
			position: 'bottom-right'
		});
	}

	function handleUpdateProperty(updatedProperty: Property) {
		properties.update((prev) =>
			prev.map((property) => (property.id === updatedProperty.id ? updatedProperty : property))
		);

		toast.success('Updated Property', {
			position: 'bottom-right'
		});
	}

	function handleDeleteProperty(propertyId: string) {
		properties.update((prev) => prev.filter((property) => property.id !== propertyId));
		// Also remove any leases associated with this property
		leases.update((prev) => prev.filter((lease) => lease.propertyId !== propertyId));

		toast.success('Deleted Property', {
			position: 'bottom-right'
		});
	}

	function handleCreateLease(lease: LeaseAgreement) {
		leases.update((prev) => [...prev, lease]);

		// Mark specific unit as unavailable if lease is active
		if (lease.status === 'active' && lease.unitId) {
			properties.update((prev) =>
				prev.map((property) => {
					if (property.id === lease.propertyId) {
						return {
							...property,
							units: property.units.map((unit) =>
								unit.id === lease.unitId ? { ...unit, isAvailable: false } : unit
							)
						};
					}
					return property;
				})
			);
		}

		toast.success('Created Lease', {
			position: 'bottom-right'
		});
	}

	function handleUpdateLease(updatedLease: LeaseAgreement) {
		leases.update((prev) => {
			const oldLease = prev.find((l) => l.id === updatedLease.id);
			const updated = prev.map((lease) => (lease.id === updatedLease.id ? updatedLease : lease));

			// Update unit availability based on lease status changes
			if (oldLease && updatedLease.unitId) {
				properties.update((props) =>
					props.map((property) => {
						if (property.id === updatedLease.propertyId) {
							return {
								...property,
								units: property.units.map((unit) => {
									if (unit.id === updatedLease.unitId) {
										return {
											...unit,
											isAvailable: updatedLease.status !== 'active'
										};
									}
									return unit;
								})
							};
						}
						return property;
					})
				);
			}

			return updated;
		});

		toast.success('Updated Lease', {
			position: 'bottom-right'
		});
	}

	function handleDeleteLease(leaseId: string) {
		leases.update((prev) => {
			const lease = prev.find((l) => l.id === leaseId);
			const updated = prev.filter((lease) => lease.id !== leaseId);

			// Mark unit as available when lease is deleted
			if (lease && lease.unitId) {
				properties.update((props) =>
					props.map((property) => {
						if (property.id === lease.propertyId) {
							return {
								...property,
								units: property.units.map((unit) =>
									unit.id === lease.unitId ? { ...unit, isAvailable: true } : unit
								)
							};
						}
						return property;
					})
				);
			}

			return updated;
		});

		toast.success('Deleted Lease', {
			position: 'bottom-right'
		});
	}
</script>

<div class="min-h-screen bg-gray-50">
	<Header bind:activeTab />

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if activeTab === 'dashboard'}
			<Dashboard tenants={$tenants} properties={$properties} leases={$leases} />
		{:else if activeTab === 'clients'}
			<ClientList
				clients={$tenants}
				onCreateClient={handleCreateTenant}
				onUpdateClient={handleUpdateTenant}
				onDeleteClient={handleDeleteTenant}
			/>
		{:else if activeTab === 'properties'}
			<PropertyList
				properties={$properties}
				onCreateProperty={handleCreateProperty}
				onUpdateProperty={handleUpdateProperty}
				onDeleteProperty={handleDeleteProperty}
			/>
		{:else if activeTab === 'leases'}
			<LeaseList
				leases={$leases}
				tenants={$tenants}
				properties={$properties}
				onCreateLease={handleCreateLease}
				onUpdateLease={handleUpdateLease}
				onDeleteLease={handleDeleteLease}
			/>
		{:else}
			<Dashboard tenants={$tenants} properties={$properties} leases={$leases} />
		{/if}
	</main>
</div>
