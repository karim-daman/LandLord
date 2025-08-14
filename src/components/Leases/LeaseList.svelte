<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import LeaseForm from './LeaseForm.svelte';
	import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
	import type { LeaseAgreement, Client, Property } from '../../types';

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
		? clients.find((c) => c.id === selectedLease.clientId)
		: undefined;
	$: selectedProperty = selectedLease
		? properties.find((p) => p.id === selectedLease.propertyId)
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
			class="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
		>
			<!-- Replaced Plus icon with SVG -->
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
				class="h-4 w-4"
				><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"
				></line></svg
			>
			<span>Create Lease</span>
		</button>
	</div>

	<SearchFilter
		bind:searchTerm
		{filterOptions}
		bind:filterValue
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
								<!-- Replaced Eye icon with SVG -->
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
									class="h-4 w-4"
									><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle
										cx="12"
										cy="12"
										r="3"
									></circle></svg
								>
							</button>
							<button
								on:click={() => handleEdit(lease)}
								class="p-1 text-gray-400 transition-colors hover:text-green-600"
								title="Edit Lease"
							>
								<!-- Replaced Edit icon with SVG -->
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
									class="h-4 w-4"
									><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg
								>
							</button>
							<button
								on:click={() => handleDelete(lease)}
								class="p-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Lease"
							>
								<!-- Replaced Trash2 icon with SVG -->
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
									class="h-4 w-4"
									><polyline points="3 6 5 6 21 6"></polyline><path
										d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									></path><line x1="10" y1="11" x2="10" y2="17"></line><line
										x1="14"
										y1="11"
										x2="14"
										y2="17"
									></line></svg
								>
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center text-sm text-gray-900">
							<!-- Replaced User icon with SVG -->
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
								class="mr-2 h-4 w-4 text-blue-600"
								><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle
									cx="12"
									cy="7"
									r="4"
								></circle></svg
							>
							<span class="font-medium">
								{clients.find((c) => c.id === lease.clientId)
									? `${clients.find((c) => c.id === lease.clientId)?.firstName} ${clients.find((c) => c.id === lease.clientId)?.lastName}`
									: 'Unknown Client'}
							</span>
						</div>

						<div class="flex items-start text-sm text-gray-600">
							<!-- Replaced Home icon with SVG -->
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
								class="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-teal-600"
								><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline
									points="9 22 9 12 15 12 15 22"
								></polyline></svg
							>
							<span class="line-clamp-2">
								{properties.find((p) => p.id === lease.propertyId)
									? properties.find((p) => p.id === lease.propertyId)?.address
									: 'Unknown Property'}
							</span>
						</div>

						<div class="flex items-center text-sm text-gray-600">
							<!-- Replaced Calendar icon with SVG -->
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
								class="mr-2 h-4 w-4 text-orange-600"
								><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line
									x1="16"
									y1="2"
									x2="16"
									y2="6"
								></line><line x1="8" y1="2" x2="8" y2="6"></line><line
									x1="3"
									y1="10"
									x2="21"
									y2="10"
								></line></svg
							>
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
						<label class="mb-1 block text-sm font-medium text-gray-700">Client</label>
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
						<label class="mb-1 block text-sm font-medium text-gray-700">Property</label>
						<p class="text-sm text-gray-900">
							{selectedProperty ? selectedProperty.address : 'Unknown Property'}
						</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
						<p class="text-sm text-gray-900">{formatDate(selectedLease.startDate)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">End Date</label>
						<p class="text-sm text-gray-900">{formatDate(selectedLease.endDate)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Monthly Rent</label>
						<p class="text-sm text-gray-900">{formatCurrency(selectedLease.monthlyRent)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Security Deposit</label>
						<p class="text-sm text-gray-900">{formatCurrency(selectedLease.securityDeposit)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Status</label>
						<span
							class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(selectedLease.status)}`}
						>
							{selectedLease.status.charAt(0).toUpperCase() + selectedLease.status.slice(1)}
						</span>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Signed Date</label>
						<p class="text-sm text-gray-900">
							{selectedLease.signedDate ? formatDate(selectedLease.signedDate) : 'Not signed'}
						</p>
					</div>

					{#if selectedLease.terms}
						<div class="md:col-span-2">
							<label class="mb-1 block text-sm font-medium text-gray-700">Lease Terms</label>
							<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
								{selectedLease.terms}
							</div>
						</div>
					{/if}

					{#if selectedLease.specialConditions}
						<div class="md:col-span-2">
							<label class="mb-1 block text-sm font-medium text-gray-700">Special Conditions</label>
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
