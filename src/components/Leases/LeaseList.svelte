<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import LeaseForm from './LeaseForm.svelte';
	import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
	import type { LeaseAgreement, Client, Property } from '../../types';
	import { calendar, calendar2, edit, eye, home2, plus, trash, user } from '../Icons/icons';

	export let leases: LeaseAgreement[];
	export let clients: Client[];
	export let properties: Property[];
	export let onCreateLease: (lease: LeaseAgreement) => void;
	export let onUpdateLease: (lease: LeaseAgreement) => void;
	export let onDeleteLease: (id: string) => void;

	let searchTerm = '';
	let filterValue = '';
	let showForm = false;
	let showDetails = false;
	let selectedLease: LeaseAgreement | undefined;
	let showDeleteConfirm = false;

	const filterOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'terminated', label: 'Terminated' }
	];

	// Reactive declarations to find the client and property for the selected lease
	$: selectedClient = selectedLease
		? clients.find((c) => c.id === selectedLease?.clientId)
		: undefined;
	$: selectedProperty = selectedLease
		? properties.find((p) => p.id === selectedLease?.propertyId)
		: undefined;

	// Added a check to ensure `leases` is an array before calling `.filter()`
	$: {
		console.log('Type of leases:', typeof leases);
		console.log('Is leases an Array?', Array.isArray(leases));
		filteredLeases = (Array.isArray(leases) ? leases : []).filter((lease) => {
			const client = clients.find((c) => c.id === lease.clientId);
			const property = properties.find((p) => p.id === lease.propertyId);

			const matchesSearch =
				(client &&
					`${client.firstName} ${client.lastName}`
						.toLowerCase()
						.includes(searchTerm.toLowerCase())) ||
				(property && property.address.toLowerCase().includes(searchTerm.toLowerCase()));

			const matchesFilter = !filterValue || lease.status === filterValue;
			return matchesSearch && matchesFilter;
		});
	}

	let filteredLeases: LeaseAgreement[];

	function handleCreate() {
		selectedLease = undefined;
		showForm = true;
	}

	function handleEdit(lease: LeaseAgreement) {
		selectedLease = lease;
		showForm = true;
	}

	function handleView(lease: LeaseAgreement) {
		selectedLease = lease;
		showDetails = true;
	}

	function handleDelete(lease: LeaseAgreement) {
		selectedLease = lease;
		showDeleteConfirm = true;
	}

	function handleSave(lease: LeaseAgreement) {
		if (selectedLease) {
			onUpdateLease(lease);
		} else {
			onCreateLease(lease);
		}
		showForm = false;
		selectedLease = undefined;
	}

	function confirmDelete() {
		if (selectedLease) {
			onDeleteLease(selectedLease.id);
		}
		showDeleteConfirm = false;
		selectedLease = undefined;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Lease Agreements</h2>

		<button
			on:click={handleCreate}
			class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			{@html plus}
			<span>Create Lease</span>
		</button>
	</div>

	<SearchFilter
		{searchTerm}
		onSearchChange={(term) => (searchTerm = term)}
		{filterOptions}
		{filterValue}
		onFilterChange={(value) => (filterValue = value)}
		placeholder="Search leases by client name or property address..."
	/>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
		{#each filteredLeases as lease (lease.id)}
			<div
				class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-center space-x-2">
							<span
								class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(lease.status)}`}
							>
								{lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
							</span>
							{#if new Date(lease.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && lease.status === 'active'}
								<span
									class="rounded-full border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800"
								>
									Expiring Soon
								</span>
							{/if}
						</div>
						<div class="flex space-x-2">
							<button
								on:click={() => handleView(lease)}
								class="p-1 text-gray-400 transition-colors hover:text-green-600"
								title="View Details"
							>
								{@html eye}
							</button>
							<button
								on:click={() => handleEdit(lease)}
								class="p-1 text-gray-400 transition-colors hover:text-green-600"
								title="Edit Lease"
							>
								{@html edit}
							</button>
							<button
								on:click={() => handleDelete(lease)}
								class="p-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Lease"
							>
								{@html trash}
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center text-sm text-gray-900">
							{@html user}
							<span class="font-medium">
								{clients.find((c) => c.id === lease.clientId)
									? `${clients.find((c) => c.id === lease.clientId)?.firstName} ${clients.find((c) => c.id === lease.clientId)?.lastName}`
									: 'Unknown Client'}
							</span>
						</div>

						<div class="flex items-start text-sm text-gray-600">
							{@html home2}
							<span class="line-clamp-2">
								{properties.find((p) => p.id === lease.propertyId)
									? properties.find((p) => p.id === lease.propertyId)?.address
									: 'Unknown Property'}
							</span>
						</div>

						<div class="flex items-center text-sm text-gray-600">
							{@html calendar2}
							<span>
								{formatDate(lease.startDate)} - {formatDate(lease.endDate)}
							</span>
						</div>

						<div class="flex items-center justify-between border-t border-gray-100 pt-3">
							<div>
								<p class="text-sm text-gray-600">Monthly Rent</p>
								<p class="font-semibold text-gray-900">{formatCurrency(lease.monthlyRent)}</p>
							</div>
							<div class="text-right">
								<p class="text-sm text-gray-600">Deposit</p>
								<p class="font-semibold text-gray-900">{formatCurrency(lease.securityDeposit)}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="border-t border-gray-100 bg-gray-50 px-6 py-3">
					<p class="text-xs text-gray-500">
						Created {formatDate(lease.createdAt)}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredLeases.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No lease agreements found matching your search criteria.</p>
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedLease = undefined;
		}}
		title={selectedLease ? 'Edit Lease Agreement' : 'Create New Lease Agreement'}
		maxWidth="max-w-4xl"
	>
		<LeaseForm
			lease={selectedLease}
			{clients}
			{properties}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedLease = undefined;
			}}
		/>
	</Modal>

	<!-- Details Modal -->
	<Modal
		isOpen={showDetails}
		onClose={() => {
			showDetails = false;
			selectedLease = undefined;
		}}
		title="Lease Agreement Details"
		maxWidth="max-w-3xl"
	>
		{#if selectedLease}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="lastName" class="mb-1 block text-sm font-medium text-gray-700">Client</label
						>
						<p class="text-sm text-gray-900">
							{selectedClient
								? `${selectedClient.firstName} ${selectedClient.lastName}`
								: 'Unknown Client'}
						</p>
						{#if selectedClient}
							<p class="mt-1 text-xs text-gray-600">{selectedClient.email}</p>
						{/if}
					</div>
					<div>
						<label for="Property" class="mb-1 block text-sm font-medium text-gray-700"
							>Property</label
						>
						<p class="text-sm text-gray-900">
							{selectedProperty ? selectedProperty.address : 'Unknown Property'}
						</p>
					</div>
					<div>
						<label for="startDate" class="mb-1 block text-sm font-medium text-gray-700"
							>Start Date</label
						>
						<p class="text-sm text-gray-900">{formatDate(selectedLease.startDate)}</p>
					</div>
					<div>
						<label for="endDate" class="mb-1 block text-sm font-medium text-gray-700"
							>End Date</label
						>
						<p class="text-sm text-gray-900">{formatDate(selectedLease.endDate)}</p>
					</div>
					<div>
						<label for="monthlyRent" class="mb-1 block text-sm font-medium text-gray-700"
							>Monthly Rent</label
						>
						<p class="text-sm text-gray-900">{formatCurrency(selectedLease.monthlyRent)}</p>
					</div>
					<div>
						<label for="securityDeposit" class="mb-1 block text-sm font-medium text-gray-700"
							>Security Deposit</label
						>
						<p class="text-sm text-gray-900">{formatCurrency(selectedLease.securityDeposit)}</p>
					</div>
					<div>
						<label for="Status" class="mb-1 block text-sm font-medium text-gray-700">Status</label>
						<span
							class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(selectedLease.status)}`}
						>
							{selectedLease.status.charAt(0).toUpperCase() + selectedLease.status.slice(1)}
						</span>
					</div>
					<div>
						<label for="signedDate" class="mb-1 block text-sm font-medium text-gray-700"
							>Signed Date</label
						>
						<p class="text-sm text-gray-900">
							{selectedLease.signedDate ? formatDate(selectedLease.signedDate) : 'Not signed'}
						</p>
					</div>

					{#if selectedLease.terms}
						<div class="md:col-span-2">
							<label for="terms" class="mb-1 block text-sm font-medium text-gray-700"
								>Lease Terms</label
							>
							<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
								{selectedLease.terms}
							</div>
						</div>
					{/if}

					{#if selectedLease.specialConditions}
						<div class="md:col-span-2">
							<label for="specialConditions" class="mb-1 block text-sm font-medium text-gray-700"
								>Special Conditions</label
							>
							<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
								{selectedLease.specialConditions}
							</div>
						</div>
					{/if}
				</div>

				<div class="border-t pt-4">
					<div class="flex justify-between text-xs text-gray-500">
						<span>Created: {new Date(selectedLease.createdAt).toLocaleString()}</span>
						<span>Updated: {new Date(selectedLease.updatedAt).toLocaleString()}</span>
					</div>
				</div>
			</div>
		{/if}
	</Modal>

	<!-- Delete Confirmation Modal -->
	<Modal
		isOpen={showDeleteConfirm}
		onClose={() => {
			showDeleteConfirm = false;
			selectedLease = undefined;
		}}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6">
			<p class="mb-6 text-gray-700">
				Are you sure you want to delete this lease agreement? This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => {
						showDeleteConfirm = false;
						selectedLease = undefined;
					}}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmDelete}
					class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
				>
					Delete
				</button>
			</div>
		</div>
	</Modal>
</div>
