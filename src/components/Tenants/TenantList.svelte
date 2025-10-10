<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import TenantForm from './TenantForm.svelte';
	import type { Tenant } from '../../types';
	import { plus } from '../Icons/icons';

	export let tenants: Tenant[];
	export let onCreateTenant: (tenant: Tenant) => void;
	export let onUpdateTenant: (tenant: Tenant) => void;
	export let onDeleteTenant: (id: string) => void;

	let searchTerm = '';
	let showForm = false;
	let showDetails = false;
	let selectedtenant: Tenant | undefined;
	let showDeleteConfirm = false; // FIX: Explicitly check if 'tenants' is an array using Array.isArray()
	// before attempting to filter. This prevents the TypeError if the variable
	// is an object or another non-array type.

	$: filteredTenants = (Array.isArray(tenants) ? tenants : []).filter(
		(tenant) =>
			`${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
			tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			tenant.phone.includes(searchTerm)
	);

	function handleCreate() {
		selectedtenant = undefined;
		showForm = true;
	}

	function handleEdit(tenant: Tenant) {
		selectedtenant = tenant;
		showForm = true;
	}

	function handleView(tenant: Tenant) {
		selectedtenant = tenant;
		showDetails = true;
	}

	function handleDelete(tenant: Tenant) {
		selectedtenant = tenant;
		showDeleteConfirm = true;
	}

	function handleSave(tenant: Tenant) {
		if (selectedtenant) {
			onUpdateTenant(tenant);
		} else {
			onCreateTenant(tenant);
		}
		showForm = false;
		selectedtenant = undefined;
	}

	function confirmDelete() {
		if (selectedtenant) {
			onDeleteTenant(selectedtenant.id);
		}
		showDeleteConfirm = false;
		selectedtenant = undefined;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Tenants</h2>
		<button
			on:click={handleCreate}
			class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			{@html plus}
			<span>Add Tenant</span>
		</button>
	</div>

	<SearchFilter
		bind:searchTerm
		placeholder="Search tenants by name, email, or phone..."
		onSearchChange={(term) => (searchTerm = term)}
		filterOptions={undefined}
		filterValue={undefined}
		onFilterChange={undefined}
	/>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredTenants as tenant (tenant.id)}
			<div
				class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<h3 class="text-lg font-semibold text-gray-900">
							{tenant.firstName}
							{tenant.lastName}
						</h3>
					</div>
					<div class="flex space-x-2">
						<button
							on:click={() => handleView(tenant)}
							class="p-1 text-gray-400 transition-colors hover:text-blue-600"
							title="View Details"
						>
							<!-- Eye Icon -->
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</button>
						<button
							on:click={() => handleEdit(tenant)}
							class="p-1 text-gray-400 transition-colors hover:text-blue-600"
							title="Edit tenant"
						>
							<!-- Edit Icon -->
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							on:click={() => handleDelete(tenant)}
							class="p-1 text-gray-400 transition-colors hover:text-red-600"
							title="Delete tenant"
						>
							<!-- Trash Icon -->
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
				<div class="space-y-3">
					<div class="flex items-center text-xs text-gray-600">
						<!-- Mail Icon -->
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg> <span class="truncate">{tenant.email}</span>
					</div>
					<div class="flex items-center text-xs text-gray-600">
						<!-- Phone Icon -->
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
							/>
						</svg> <span>{tenant.phone}</span>
					</div>
					<!-- <p class="line-clamp-2 text-xs text-gray-600">
						{tenant.address}
					</p> -->
				</div>
				<div class="mt-4 border-t border-gray-100 pt-4">
					<p class="text-xs text-gray-500">
						Added {new Date(tenant.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredTenants.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No tenants found matching your search.</p>
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedtenant = undefined;
		}}
		title={selectedtenant ? 'Edit tenant' : 'Create New Tenant'}
	>
		<TenantForm
			tenant={selectedtenant}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedtenant = undefined;
			}}
		/>
	</Modal>

	<!-- Details Modal -->
	<Modal
		isOpen={showDetails}
		onClose={() => {
			showDetails = false;
			selectedtenant = undefined;
		}}
		title="Tenant Details"
	>
		{#if selectedtenant}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="Name" class="mb-1 block text-xs font-medium text-gray-700">Name</label>
						<p class="text-xs text-gray-900">
							{selectedtenant.firstName}
							{selectedtenant.lastName}
						</p>
					</div>
					<div>
						<label for="email" class="mb-1 block text-xs font-medium text-gray-700">Email</label>
						<p class="text-xs text-gray-900">{selectedtenant.email}</p>
					</div>
					<div>
						<label for="phone" class="mb-1 block text-xs font-medium text-gray-700">Phone</label>
						<p class="text-xs text-gray-900">{selectedtenant.phone}</p>
					</div>
					<div>
						<label for="dateOfBirth" class="mb-1 block text-xs font-medium text-gray-700"
							>Date of Birth</label
						>
						<p class="text-xs text-gray-900">
							{selectedtenant.dateOfBirth
								? new Date(selectedtenant.dateOfBirth).toLocaleDateString()
								: 'Not provided'}
						</p>
					</div>
					<!-- <div class="md:col-span-2">
						<label for="address" class="mb-1 block text-xs font-medium text-gray-700">Address</label
						>
						<p class="text-xs text-gray-900">{selectedtenant.address}</p>
					</div> -->
					<div>
						<label for="emergencyContact" class="mb-1 block text-xs font-medium text-gray-700"
							>Emergency Contact</label
						>
						<p class="text-xs text-gray-900">{selectedtenant.emergencyContact || 'Not provided'}</p>
					</div>
					<div>
						<label for="emergencyPhone" class="mb-1 block text-xs font-medium text-gray-700"
							>Emergency Phone</label
						>
						<p class="text-xs text-gray-900">{selectedtenant.emergencyPhone || 'Not provided'}</p>
					</div>
				</div>
				<div class="border-t pt-4">
					<div class="flex justify-between text-xs text-gray-500">
						<span>Created: {new Date(selectedtenant.createdAt).toLocaleString()}</span>
						<span>Updated: {new Date(selectedtenant.updatedAt).toLocaleString()}</span>
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
			selectedtenant = undefined;
		}}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6">
			<p class="mb-6 text-gray-700">
				Are you sure you want to delete {selectedtenant?.firstName}
				{selectedtenant?.lastName}? This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => {
						showDeleteConfirm = false;
						selectedtenant = undefined;
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
