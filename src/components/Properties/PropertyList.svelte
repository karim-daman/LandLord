<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import PropertyForm from './PropertyForm.svelte';
	import { formatCurrency } from '../../utils/helpers';
	import type { Property } from '../../types';

	export let properties: Property[];
	export let onCreateProperty: (property: Property) => void;
	export let onUpdateProperty: (property: Property) => void;
	export let onDeleteProperty: (id: string) => void;

	let searchTerm = '';
	let filterValue = '';
	let showForm = false;
	let showDetails = false;
	let selectedProperty: Property | undefined;
	let showDeleteConfirm = false;

	const filterOptions = [
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'house', label: 'House' },
		{ value: 'condo', label: 'Condo' },
		{ value: 'townhouse', label: 'Townhouse' },
		{ value: 'commercial', label: 'Commercial' }
	];

	// The fix is here: we check if properties is an array before trying to filter it.
	$: filteredProperties = Array.isArray(properties)
		? properties.filter((property) => {
				const matchesSearch =
					property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
					property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
					property.state.toLowerCase().includes(searchTerm.toLowerCase());
				const matchesFilter = !filterValue || property.propertyType === filterValue;
				return matchesSearch && matchesFilter;
			})
		: [];

	function handleCreate() {
		selectedProperty = undefined;
		showForm = true;
	}

	function handleEdit(property: Property) {
		selectedProperty = property;
		showForm = true;
	}

	function handleView(property: Property) {
		selectedProperty = property;
		showDetails = true;
	}

	function handleDelete(property: Property) {
		selectedProperty = property;
		showDeleteConfirm = true;
	}

	function handleSave(property: Property) {
		if (selectedProperty) {
			onUpdateProperty(property);
		} else {
			onCreateProperty(property);
		}
		showForm = false;
		selectedProperty = undefined;
	}

	function confirmDelete() {
		if (selectedProperty) {
			onDeleteProperty(selectedProperty.id);
		}
		showDeleteConfirm = false;
		selectedProperty = undefined;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Properties</h2>
		<button
			on:click={handleCreate}
			class="flex items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
		>
			<!-- Plus Icon -->
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<span>Add Property</span>
		</button>
	</div>

	<SearchFilter
		bind:searchTerm
		{filterOptions}
		bind:filterValue
		placeholder="Search properties by address, city, or state..."
	/>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredProperties as property (property.id)}
			<div
				class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center space-x-2">
								<span
									class={`rounded-full px-2 py-1 text-xs font-medium ${
										property.isAvailable
											? 'border border-green-200 bg-green-100 text-green-800'
											: 'border border-red-200 bg-red-100 text-red-800'
									}`}
								>
									{property.isAvailable ? 'Available' : 'Occupied'}
								</span>
								<span
									class="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 capitalize"
								>
									{property.propertyType}
								</span>
							</div>
							<h3 class="line-clamp-2 text-lg font-semibold text-gray-900">
								{property.address}
							</h3>
						</div>
						<div class="ml-2 flex space-x-2">
							<button
								on:click={() => handleView(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
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
								on:click={() => handleEdit(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
								title="Edit Property"
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
								on:click={() => handleDelete(property)}
								class="p-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Property"
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
							<!-- MapPin Icon -->
							<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<span class="truncate">{property.city}, {property.state} {property.zipCode}</span>
						</div>
						<div class="flex items-center text-sm text-gray-600">
							<!-- Home Icon -->
							<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							<span
								>{property.bedrooms} bed, {property.bathrooms} bath • {property.squareFeet} sq ft</span
							>
						</div>
						<div class="flex items-center text-sm font-medium text-gray-900">
							<!-- DollarSign Icon -->
							<svg
								class="mr-2 h-4 w-4 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>{formatCurrency(property.monthlyRent)}/month</span>
						</div>
					</div>

					{#if property.amenities.length > 0}
						<div class="mt-4">
							<div class="flex flex-wrap gap-1">
								{#each property.amenities.slice(0, 3) as amenity (amenity)}
									<span class="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
										{amenity}
									</span>
								{/each}
								{#if property.amenities.length > 3}
									<span class="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
										+{property.amenities.length - 3} more
									</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="border-t border-gray-100 bg-gray-50 px-6 py-3">
					<p class="text-xs text-gray-500">
						Added {new Date(property.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredProperties.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No properties found matching your search criteria.</p>
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedProperty = undefined;
		}}
		title={selectedProperty ? 'Edit Property' : 'Create New Property'}
		maxWidth="max-w-4xl"
	>
		<PropertyForm
			property={selectedProperty}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedProperty = undefined;
			}}
		/>
	</Modal>

	<!-- Details Modal -->
	<Modal
		isOpen={showDetails}
		onClose={() => {
			showDetails = false;
			selectedProperty = undefined;
		}}
		title="Property Details"
		maxWidth="max-w-3xl"
	>
		{#if selectedProperty}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="md:col-span-2">
						<label class="mb-1 block text-sm font-medium text-gray-700">Address</label>
						<p class="text-sm text-gray-900">{selectedProperty.address}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">City</label>
						<p class="text-sm text-gray-900">{selectedProperty.city}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">State</label>
						<p class="text-sm text-gray-900">{selectedProperty.state}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
						<p class="text-sm text-gray-900">{selectedProperty.zipCode}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Property Type</label>
						<p class="text-sm text-gray-900 capitalize">{selectedProperty.propertyType}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Bedrooms</label>
						<p class="text-sm text-gray-900">{selectedProperty.bedrooms}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Bathrooms</label>
						<p class="text-sm text-gray-900">{selectedProperty.bathrooms}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Square Feet</label>
						<p class="text-sm text-gray-900">{selectedProperty.squareFeet.toLocaleString()}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Monthly Rent</label>
						<p class="text-sm text-gray-900">{formatCurrency(selectedProperty.monthlyRent)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Security Deposit</label>
						<p class="text-sm text-gray-900">{formatCurrency(selectedProperty.deposit)}</p>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Availability</label>
						<p class="text-sm text-gray-900">
							{selectedProperty.isAvailable ? 'Available' : 'Occupied'}
						</p>
					</div>
					{#if selectedProperty.amenities.length > 0}
						<div class="md:col-span-2">
							<label class="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
							<div class="flex flex-wrap gap-2">
								{#each selectedProperty.amenities as amenity (amenity)}
									<span class="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
										{amenity}
									</span>
								{/each}
							</div>
						</div>
					{/if}
					{#if selectedProperty.description}
						<div class="md:col-span-2">
							<label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
							<p class="text-sm text-gray-900">{selectedProperty.description}</p>
						</div>
					{/if}
				</div>
				<div class="border-t pt-4">
					<div class="flex justify-between text-xs text-gray-500">
						<span>Created: {new Date(selectedProperty.createdAt).toLocaleString()}</span>
						<span>Updated: {new Date(selectedProperty.updatedAt).toLocaleString()}</span>
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
			selectedProperty = undefined;
		}}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6">
			<p class="mb-6 text-gray-700">
				Are you sure you want to delete the property at {selectedProperty?.address}? This action
				cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => {
						showDeleteConfirm = false;
						selectedProperty = undefined;
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
