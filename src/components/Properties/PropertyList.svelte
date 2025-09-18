<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import PropertyForm from './PropertyForm.svelte';
	import { formatCurrency } from '../../utils/helpers';
	import { getImageAsBase64 } from '$lib/stores';
	import type { Property } from '../../types';
	import { onMount } from 'svelte';

	import { eye, edit, mappin, trash, home, dollarsign, plus, building2 } from '../Icons/icons';

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
	let imageDataUrls: { [key: string]: string } = {};
	let loadingImages = false;
	let cardImageIndexes: { [key: string]: number } = {};

	const filterOptions = [
		{ value: 'complex', label: 'Complex' },
		{ value: 'house', label: 'House' },
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'commercial', label: 'Commercial' }
	];

	// Filter properties based on search and filter criteria
	$: filteredProperties = Array.isArray(properties)
		? properties.filter((property) => {
				const matchesSearch =
					property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
					property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
					property.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(property.name && property.name.toLowerCase().includes(searchTerm.toLowerCase()));
				const matchesFilter = !filterValue || property.propertyType === filterValue;
				return matchesSearch && matchesFilter;
			})
		: [];

	// Load images for property cards on mount
	onMount(async () => {
		await loadCardImages();
	});

	// Watch for changes in properties and reload images
	$: if (properties) {
		loadCardImages();
	}

	async function loadCardImages() {
		const newImageDataUrls: { [key: string]: string } = {};
		const newCardImageIndexes: { [key: string]: number } = {};

		try {
			await Promise.all(
				properties.map(async (property) => {
					// Initialize carousel index for each property
					newCardImageIndexes[property.id] = 0;

					if (!property.images || property.images.length === 0) return;

					// Load all images for this property
					await Promise.all(
						property.images.map(async (img) => {
							try {
								const base64Data = await getImageAsBase64(img.path);
								if (base64Data) {
									newImageDataUrls[img.id] = base64Data;
								}
							} catch (error) {
								console.error(`Failed to load image ${img.filename}:`, error);
							}
						})
					);
				})
			);

			imageDataUrls = { ...imageDataUrls, ...newImageDataUrls };
			cardImageIndexes = { ...cardImageIndexes, ...newCardImageIndexes };
		} catch (error) {
			console.error('Error loading card images:', error);
		}
	}

	async function loadPropertyImages(property: Property) {
		if (!property.images || property.images.length === 0) return;

		loadingImages = true;
		const newImageDataUrls: { [key: string]: string } = {};

		try {
			await Promise.all(
				property.images.map(async (img) => {
					try {
						const base64Data = await getImageAsBase64(img.path);
						if (base64Data) {
							newImageDataUrls[img.id] = base64Data;
						}
					} catch (error) {
						console.error(`Failed to load image ${img.filename}:`, error);
					}
				})
			);

			imageDataUrls = { ...imageDataUrls, ...newImageDataUrls };
		} catch (error) {
			console.error('Error loading property images:', error);
		} finally {
			loadingImages = false;
		}
	}

	function nextImage(propertyId: string, imageCount: number) {
		cardImageIndexes[propertyId] = (cardImageIndexes[propertyId] + 1) % imageCount;
		cardImageIndexes = { ...cardImageIndexes };
	}

	function previousImage(propertyId: string, imageCount: number) {
		cardImageIndexes[propertyId] =
			cardImageIndexes[propertyId] === 0 ? imageCount - 1 : cardImageIndexes[propertyId] - 1;
		cardImageIndexes = { ...cardImageIndexes };
	}

	function setImageIndex(propertyId: string, index: number) {
		cardImageIndexes[propertyId] = index;
		cardImageIndexes = { ...cardImageIndexes };
	}

	function handleCreate() {
		selectedProperty = undefined;
		showForm = true;
	}

	function handleEdit(property: Property) {
		selectedProperty = property;
		showForm = true;
	}

	async function handleView(property: Property) {
		selectedProperty = property;
		showDetails = true;

		// Load images when viewing property details
		if (property.images && property.images.length > 0) {
			await loadPropertyImages(property);
		}
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

	function closeDetailsModal() {
		showDetails = false;
		selectedProperty = undefined;
	}

	function getAvailableUnitsCount(property: Property): number {
		return property.units ? property.units.filter((unit) => unit.isAvailable).length : 0;
	}

	function getTotalUnitsCount(property: Property): number {
		return property.units ? property.units.length : 0;
	}

	function getPropertyRentRange(property: Property): string {
		if (!property.units || property.units.length === 0) return '$0';

		const rents = property.units.map((unit) => unit.monthlyRent);
		const minRent = Math.min(...rents);
		const maxRent = Math.max(...rents);

		if (minRent === maxRent) {
			return formatCurrency(minRent);
		}
		return `${formatCurrency(minRent)} - ${formatCurrency(maxRent)}`;
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Properties</h2>

		<button
			on:click={handleCreate}
			class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			{@html plus}
			<span>Add Property</span>
		</button>
	</div>

	<SearchFilter
		bind:searchTerm
		onSearchChange={(term) => (searchTerm = term)}
		{filterOptions}
		bind:filterValue
		onFilterChange={(value) => (filterValue = value)}
		placeholder="Search properties by address, city, state, or name..."
	/>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredProperties as property (property.id)}
			<div
				class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
			>
				{#if property.images && property.images.length > 0}
					<div class="relative h-48 bg-gray-200">
						{#if property.images[cardImageIndexes[property.id] || 0] && imageDataUrls[property.images[cardImageIndexes[property.id] || 0].id]}
							<img
								src={imageDataUrls[property.images[cardImageIndexes[property.id] || 0].id]}
								alt={property.images[cardImageIndexes[property.id] || 0].caption ||
									property.images[cardImageIndexes[property.id] || 0].filename}
								class="h-full w-full object-cover"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-gray-300">
								<div class="text-center">
									<div
										class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
									></div>
									<div class="text-xs text-gray-500">Loading image...</div>
								</div>
							</div>
						{/if}

						{#if property.images.length > 1}
							<button
								on:click={() => previousImage(property.id, property.images.length)}
								class="absolute top-1/2 left-2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
								aria-label="Previous image"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
							</button>
							<button
								on:click={() => nextImage(property.id, property.images.length)}
								class="absolute top-1/2 right-2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
								aria-label="Next image"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>

							<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
								{#each property.images as _, index}
									<button
										on:click={() => setImageIndex(property.id, index)}
										class={`h-2 w-2 rounded-full transition-all ${
											index === (cardImageIndexes[property.id] || 0)
												? 'bg-white'
												: 'bg-white/50 hover:bg-white/75'
										}`}
										aria-label={`Go to image ${index + 1}`}
									></button>
								{/each}
							</div>

							<div
								class="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
							>
								{(cardImageIndexes[property.id] || 0) + 1}/{property.images.length}
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex h-48 items-center justify-center bg-gray-200">
						<div class="text-center text-gray-500">
							{@html building2}
							<div class="mt-2 text-xs">No images</div>
						</div>
					</div>
				{/if}

				<div class="p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center space-x-2">
								<span
									class={`rounded-full px-2 py-1 text-xs font-medium ${
										getAvailableUnitsCount(property) > 0
											? 'border border-green-200 bg-green-100 text-green-800'
											: 'border border-red-200 bg-red-100 text-red-800'
									}`}
								>
									{getAvailableUnitsCount(property)}/{getTotalUnitsCount(property)} Available
								</span>
								<span
									class="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 capitalize"
								>
									{property.propertyType}
								</span>
							</div>
							<h3 class="line-clamp-2 text-lg font-semibold text-gray-900">
								{property.name || property.address}
							</h3>
							{#if property.name}
								<p class="text-xs text-gray-600">{property.address}</p>
							{/if}
						</div>
						<div class="ml-2 flex space-x-2">
							<button
								on:click={() => handleView(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
								title="View Details"
							>
								{@html eye}
							</button>
							<button
								on:click={() => handleEdit(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
								title="Edit Property"
							>
								{@html edit}
							</button>
							<button
								on:click={() => handleDelete(property)}
								class="p-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Property"
							>
								{@html trash}
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<div class="flex items-center text-xs text-gray-600">
							{@html mappin}
							<span class="truncate">{property.city}, {property.state} {property.zipCode}</span>
						</div>
						<div class="flex items-center text-xs text-gray-600">
							{@html building2}
							<span>{getTotalUnitsCount(property)} units total</span>
						</div>
						<div class="flex items-center text-xs font-medium text-gray-900">
							{@html dollarsign}
							<span>{getPropertyRentRange(property)}/month</span>
						</div>
					</div>

					{#if property.description}
						<div class="mt-4">
							<p class="line-clamp-2 text-xs text-gray-600">{property.description}</p>
						</div>
					{/if}
				</div>

				<div class="border-t border-gray-100 bg-gray-50 px-6 py-3">
					<p class="text-xs text-gray-500">
						Added {new Date(property.createdAt).toLocaleDateString()}
						{#if property.images && property.images.length > 0}
							<span class="ml-2 text-blue-600"
								>• {property.images.length} image{property.images.length > 1 ? 's' : ''}</span
							>
						{/if}
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

	<Modal
		isOpen={showDetails}
		onClose={closeDetailsModal}
		title="Property Details"
		maxWidth="max-w-6xl"
	>
		{#if selectedProperty}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="md:col-span-2">
						<label for="property-name" class="mb-1 block text-xs font-medium text-gray-700"
							>Property Name</label
						>
						<input
							id="property-name"
							class="text-sm text-gray-900"
							value={selectedProperty.name || 'N/A'}
							readonly
						/>
					</div>
					<div class="md:col-span-2">
						<label for="property-address" class="mb-1 block text-xs font-medium text-gray-700"
							>Address</label
						>
						<p id="property-address" class="text-sm text-gray-900">{selectedProperty.address}</p>
					</div>
					<div>
						<label for="property-city" class="mb-1 block text-xs font-medium text-gray-700"
							>City</label
						>
						<p id="property-city" class="text-sm text-gray-900">{selectedProperty.city}</p>
					</div>
					<div>
						<label for="property-state" class="mb-1 block text-xs font-medium text-gray-700"
							>State</label
						>
						<p id="property-state" class="text-sm text-gray-900">{selectedProperty.state}</p>
					</div>
					<div>
						<label for="property-zip" class="mb-1 block text-xs font-medium text-gray-700"
							>ZIP Code</label
						>
						<p id="property-zip" class="text-sm text-gray-900">{selectedProperty.zipCode}</p>
					</div>
					<div>
						<label for="property-type" class="mb-1 block text-xs font-medium text-gray-700"
							>Property Type</label
						>
						<p id="property-type" class="text-sm text-gray-900 capitalize">
							{selectedProperty.propertyType}
						</p>
					</div>

					{#if selectedProperty.description}
						<div class="md:col-span-2">
							<label for="unit-description" class="mb-1 block text-xs font-medium text-gray-700"
								>Description</label
							>
							<p class="text-sm text-gray-900">{selectedProperty.description}</p>
						</div>
					{/if}

					{#if selectedProperty.units && selectedProperty.units.length > 0}
						<div class="md:col-span-2">
							<label for="units-count" class="mb-2 block text-sm font-medium text-gray-900"
								>Units ({selectedProperty.units.length})</label
							>
							<span id="units-count" class="sr-only">{selectedProperty.units.length}</span>
							<div class="space-y-3">
								{#each selectedProperty.units as unit (unit.id)}
									<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
										<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
											<div>
												<label
													for="unit-number-{unit.id}"
													class="mb-1 block text-xs font-medium text-gray-700">Unit Number</label
												>
												<input
													id="unit-number-{unit.id}"
													class="text-sm text-gray-900"
													value={unit.unitNumber}
													readonly
												/>
											</div>
											<div>
												<label
													for="bedrooms-bathrooms-{unit.id}"
													class="mb-1 block text-xs font-medium text-gray-700"
													>Bedrooms/Bathrooms</label
												>
												<input
													id="bedrooms-bathrooms-{unit.id}"
													class="text-sm text-gray-900"
													value="{unit.bedrooms}BR/{unit.bathrooms}BA"
													readonly
												/>
											</div>
											<div>
												<label
													for="square-feet-{unit.id}"
													class="mb-1 block text-xs font-medium text-gray-700">Square Feet</label
												>
												<p id="square-feet-{unit.id}" class="text-sm text-gray-900">
													{unit.squareFeet.toLocaleString()}
												</p>
											</div>
											<div>
												<label
													for="monthly-rent"
													class="mb-1 block text-xs font-medium text-gray-700">Monthly Rent</label
												>
												<p class="text-sm text-gray-900">{formatCurrency(unit.monthlyRent)}</p>
											</div>
											<div>
												<label
													for="security-deposit"
													class="mb-1 block text-xs font-medium text-gray-700"
													>Security Deposit</label
												>
												<p class="text-sm text-gray-900">{formatCurrency(unit.deposit)}</p>
											</div>
											<div>
												<label for="status" class="mb-1 block text-xs font-medium text-gray-700"
													>Status</label
												>
												<span
													class={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
														unit.isAvailable
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{unit.isAvailable ? 'Available' : 'Occupied'}
												</span>
											</div>
											{#if unit.description}
												<div class="md:col-span-2">
													<label
														for="description"
														class="mb-1 block text-xs font-medium text-gray-700">Description</label
													>
													<p id="unit-description" class="text-sm text-gray-900">
														{unit.description}
													</p>
												</div>
											{/if}
											{#if unit.amenities && unit.amenities.length > 0}
												<div class="md:col-span-4">
													<label
														for="amenities"
														class="mb-1 block text-xs font-medium text-gray-700">Amenities</label
													>
													<div class="flex flex-wrap gap-1">
														{#each unit.amenities as amenity}
															<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
																{amenity}
															</span>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if selectedProperty.images && selectedProperty.images.length > 0}
						<div class="md:col-span-2">
							<label class="mb-2 block text-sm font-medium text-gray-900">
								Property Images ({selectedProperty.images.length})
							</label>

							{#if loadingImages}
								<div class="flex items-center justify-center py-8">
									<div class="flex items-center space-x-2 text-sm text-gray-500">
										<div
											class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
										></div>
										<span>Loading images...</span>
									</div>
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
									{#each selectedProperty.images as img (img.id)}
										<div
											class="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
										>
											{#if imageDataUrls[img.id]}
												<img
													src={imageDataUrls[img.id]}
													alt={img.caption || img.filename}
													class="h-32 w-full object-cover transition-transform group-hover:scale-105"
												/>
											{:else}
												<div class="flex h-32 w-full items-center justify-center bg-gray-200">
													<div class="text-center">
														<div class="mb-1 text-xs text-gray-400">Failed to load</div>
														<div class="truncate px-2 text-xs text-gray-500">{img.filename}</div>
													</div>
												</div>
											{/if}

											<div
												class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2"
											>
												<div class="truncate text-xs text-white" title={img.filename}>
													{img.filename}
												</div>
												{#if img.caption}
													<div class="truncate text-xs text-gray-200" title={img.caption}>
														{img.caption}
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
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
				Are you sure you want to delete the property "{selectedProperty?.name ||
					selectedProperty?.address}"? This will also delete all associated units and lease
				agreements. This action cannot be undone.
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
