<script lang="ts">
	import { initializeAllStores, clients, properties, leaseAgreement as leases } from '$lib/stores';
	import toast from 'svelte-5-french-toast';
	import { onMount } from 'svelte';

	onMount(async () => {
		toast.promise(
			initializeAllStores().then((res) => {
				if (!res.success) throw new Error(res.message); // Convert to rejection
				return res.message; // Success case
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

	import Header from '../components/Layout/Header.svelte';
	import Dashboard from '../components/Dashboard/Dashboard.svelte';
	import ClientList from '../components/Clients/ClientList.svelte';
	import PropertyList from '../components/Properties/PropertyList.svelte';
	import LeaseList from '../components/Leases/LeaseList.svelte';
	import type { Client, Property, LeaseAgreement } from '../types';

	let activeTab = 'dashboard';

	function handleCreateClient(client: Client) {
		clients.update((prev) => [...prev, client]);
	}

	function handleUpdateClient(updatedClient: Client) {
		clients.update((prev) =>
			prev.map((client) => (client.id === updatedClient.id ? updatedClient : client))
		);
	}

	function handleDeleteClient(clientId: string) {
		clients.update((prev) => prev.filter((client) => client.id !== clientId));
		// Also remove any leases associated with this client
		leases.update((prev) => prev.filter((lease) => lease.clientId !== clientId));
	}

	function handleCreateProperty(property: Property) {
		properties.update((prev) => [...prev, property]);
	}

	function handleUpdateProperty(updatedProperty: Property) {
		properties.update((prev) =>
			prev.map((property) => (property.id === updatedProperty.id ? updatedProperty : property))
		);
	}

	function handleDeleteProperty(propertyId: string) {
		properties.update((prev) => prev.filter((property) => property.id !== propertyId));
		// Also remove any leases associated with this property
		leases.update((prev) => prev.filter((lease) => lease.propertyId !== propertyId));
	}

	function handleCreateLease(lease: LeaseAgreement) {
		leases.update((prev) => [...prev, lease]);
		// Mark property as unavailable if lease is active
		if (lease.status === 'active') {
			properties.update((prev) =>
				prev.map((property) =>
					property.id === lease.propertyId ? { ...property, isAvailable: false } : property
				)
			);
		}
	}

	function handleUpdateLease(updatedLease: LeaseAgreement) {
		leases.update((prev) => {
			const oldLease = prev.find((l) => l.id === updatedLease.id);
			const updated = prev.map((lease) => (lease.id === updatedLease.id ? updatedLease : lease));

			// Update property availability based on lease status changes
			if (oldLease && oldLease.status !== updatedLease.status) {
				properties.update((props) =>
					props.map((property) => {
						if (property.id === updatedLease.propertyId) {
							return {
								...property,
								isAvailable: updatedLease.status !== 'active'
							};
						}
						return property;
					})
				);
			}

			return updated;
		});
	}

	function handleDeleteLease(leaseId: string) {
		leases.update((prev) => {
			const lease = prev.find((l) => l.id === leaseId);
			const updated = prev.filter((lease) => lease.id !== leaseId);

			// Mark property as available when lease is deleted
			if (lease) {
				properties.update((props) =>
					props.map((property) =>
						property.id === lease.propertyId ? { ...property, isAvailable: true } : property
					)
				);
			}

			return updated;
		});
	}
</script>

<div class="min-h-screen bg-gray-50">
	<Header bind:activeTab />

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if activeTab === 'dashboard'}
			<Dashboard clients={$clients} properties={$properties} leases={$leases} />
		{:else if activeTab === 'clients'}
			<ClientList
				clients={$clients}
				onCreateClient={handleCreateClient}
				onUpdateClient={handleUpdateClient}
				onDeleteClient={handleDeleteClient}
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
				clients={$clients}
				properties={$properties}
				onCreateLease={handleCreateLease}
				onUpdateLease={handleUpdateLease}
				onDeleteLease={handleDeleteLease}
			/>
		{:else}
			<Dashboard clients={$clients} properties={$properties} leases={$leases} />
		{/if}
	</main>
</div>
