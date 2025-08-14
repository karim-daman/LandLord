<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import ClientForm from './ClientForm.svelte';
	import type { Client } from '../../types';
	import { plus } from '../Icons/icons';

	export let clients: Client[];
	export let onCreateClient: (client: Client) => void;
	export let onUpdateClient: (client: Client) => void;
	export let onDeleteClient: (id: string) => void;

	let searchTerm = '';
	let showForm = false;
	let showDetails = false;
	let selectedClient: Client | undefined;
	let showDeleteConfirm = false; // FIX: Explicitly check if 'clients' is an array using Array.isArray()
	// before attempting to filter. This prevents the TypeError if the variable
	// is an object or another non-array type.

	$: filteredClients = (Array.isArray(clients) ? clients : []).filter(
		(client) =>
			`${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			client.phone.includes(searchTerm)
	);

	function handleCreate() {
		selectedClient = undefined;
		showForm = true;
	}

	function handleEdit(client: Client) {
		selectedClient = client;
		showForm = true;
	}

	function handleView(client: Client) {
		selectedClient = client;
		showDetails = true;
	}

	function handleDelete(client: Client) {
		selectedClient = client;
		showDeleteConfirm = true;
	}

	function handleSave(client: Client) {
		if (selectedClient) {
			onUpdateClient(client);
		} else {
			onCreateClient(client);
		}
		showForm = false;
		selectedClient = undefined;
	}

	function confirmDelete() {
		if (selectedClient) {
			onDeleteClient(selectedClient.id);
		}
		showDeleteConfirm = false;
		selectedClient = undefined;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Clients</h2>
		<button
			on:click={handleCreate}
			class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			{@html plus}
			<span>Add Client</span>
		</button>
	</div>

	<SearchFilter
		bind:searchTerm
		placeholder="Search clients by name, email, or phone..."
		onSearchChange={(term) => (searchTerm = term)}
		filterOptions={undefined}
		filterValue={undefined}
		onFilterChange={undefined}
	/>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredClients as client (client.id)}
			<div
				class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="mb-4 flex items-start justify-between">
					<div>
						<h3 class="text-lg font-semibold text-gray-900">
							{client.firstName}
							{client.lastName}
						</h3>
					</div>
					<div class="flex space-x-2">
						<button
							on:click={() => handleView(client)}
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
							on:click={() => handleEdit(client)}
							class="p-1 text-gray-400 transition-colors hover:text-blue-600"
							title="Edit Client"
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
							on:click={() => handleDelete(client)}
							class="p-1 text-gray-400 transition-colors hover:text-red-600"
							title="Delete Client"
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
					<div class="flex items-center text-sm text-gray-600">
						<!-- Mail Icon -->
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg> <span class="truncate">{client.email}</span>
					</div>
					<div class="flex items-center text-sm text-gray-600">
						<!-- Phone Icon -->
						<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
							/>
						</svg> <span>{client.phone}</span>
					</div>
					<p class="line-clamp-2 text-sm text-gray-600">
						{client.address}
					</p>
				</div>
				<div class="mt-4 border-t border-gray-100 pt-4">
					<p class="text-xs text-gray-500">
						Added {new Date(client.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredClients.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No clients found matching your search.</p>
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedClient = undefined;
		}}
		title={selectedClient ? 'Edit Client' : 'Create New Client'}
	>
		<ClientForm
			client={selectedClient}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedClient = undefined;
			}}
		/>
	</Modal>

	<!-- Details Modal -->
	<Modal
		isOpen={showDetails}
		onClose={() => {
			showDetails = false;
			selectedClient = undefined;
		}}
		title="Client Details"
	>
		{#if selectedClient}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="Name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
						<p class="text-sm text-gray-900">
							{selectedClient.firstName}
							{selectedClient.lastName}
						</p>
					</div>
					<div>
						<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
						<p class="text-sm text-gray-900">{selectedClient.email}</p>
					</div>
					<div>
						<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">Phone</label>
						<p class="text-sm text-gray-900">{selectedClient.phone}</p>
					</div>
					<div>
						<label for="dateOfBirth" class="mb-1 block text-sm font-medium text-gray-700"
							>Date of Birth</label
						>
						<p class="text-sm text-gray-900">
							{selectedClient.dateOfBirth
								? new Date(selectedClient.dateOfBirth).toLocaleDateString()
								: 'Not provided'}
						</p>
					</div>
					<div class="md:col-span-2">
						<label for="address" class="mb-1 block text-sm font-medium text-gray-700">Address</label
						>
						<p class="text-sm text-gray-900">{selectedClient.address}</p>
					</div>
					<div>
						<label for="emergencyContact" class="mb-1 block text-sm font-medium text-gray-700"
							>Emergency Contact</label
						>
						<p class="text-sm text-gray-900">{selectedClient.emergencyContact || 'Not provided'}</p>
					</div>
					<div>
						<label for="emergencyPhone" class="mb-1 block text-sm font-medium text-gray-700"
							>Emergency Phone</label
						>
						<p class="text-sm text-gray-900">{selectedClient.emergencyPhone || 'Not provided'}</p>
					</div>
				</div>
				<div class="border-t pt-4">
					<div class="flex justify-between text-xs text-gray-500">
						<span>Created: {new Date(selectedClient.createdAt).toLocaleString()}</span>
						<span>Updated: {new Date(selectedClient.updatedAt).toLocaleString()}</span>
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
			selectedClient = undefined;
		}}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6">
			<p class="mb-6 text-gray-700">
				Are you sure you want to delete {selectedClient?.firstName}
				{selectedClient?.lastName}? This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => {
						showDeleteConfirm = false;
						selectedClient = undefined;
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
