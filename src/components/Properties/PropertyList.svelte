<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import PropertyForm from './PropertyForm.svelte';
	import { formatCurrency } from '../../utils/helpers';
	import { getImageAsBase64 } from '$lib/stores';
	import type { Property } from '../../types';
	import { onMount } from 'svelte';

	import { eye, edit, mappin, trash, home, dollarsign, plus } from '../Icons/icons';

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
		placeholder="Search properties by address, city, or state..."
	/>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredProperties as property (property.id)}
			<div
				class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
			>
				<!-- Image Carousel Section -->
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

						<!-- Navigation Arrows (only show if more than 1 image) -->
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

							<!-- Dot Indicators -->
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

							<!-- Image Counter -->
							<div
								class="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
							>
								{(cardImageIndexes[property.id] || 0) + 1}/{property.images.length}
							</div>
						{/if}
					</div>
				{:else}
					<!-- Placeholder when no images -->
					<div class="flex h-48 items-center justify-center bg-gray-200">
						<div class="text-center text-gray-500">
							{@html home}
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
							{@html home}
							<span
								>{property.bedrooms} bed, {property.bathrooms} bath • {property.squareFeet} sq ft</span
							>
						</div>
						<div class="flex items-center text-xs font-medium text-gray-900">
							{@html dollarsign}
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
		onClose={closeDetailsModal}
		title="Property Details"
		maxWidth="max-w-4xl"
	>
		{#if selectedProperty}
			<div class="space-y-6 p-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="md:col-span-2">
						<label for="address" class="mb-1 block text-xs font-medium text-gray-700">Address</label
						>
						<p class="text-xs text-gray-900">{selectedProperty.address}</p>
					</div>
					<div>
						<label for="city" class="mb-1 block text-xs font-medium text-gray-700">City</label>
						<p class="text-xs text-gray-900">{selectedProperty.city}</p>
					</div>
					<div>
						<label for="state" class="mb-1 block text-xs font-medium text-gray-700">State</label>
						<p class="text-xs text-gray-900">{selectedProperty.state}</p>
					</div>
					<div>
						<label for="zipCode" class="mb-1 block text-xs font-medium text-gray-700"
							>ZIP Code</label
						>
						<p class="text-xs text-gray-900">{selectedProperty.zipCode}</p>
					</div>
					<div>
						<label for="Type" class="mb-1 block text-xs font-medium text-gray-700"
							>Property Type</label
						>
						<p class="text-xs text-gray-900 capitalize">{selectedProperty.propertyType}</p>
					</div>
					<div>
						<label for="Bedrooms" class="mb-1 block text-xs font-medium text-gray-700"
							>Bedrooms</label
						>
						<p class="text-xs text-gray-900">{selectedProperty.bedrooms}</p>
					</div>
					<div>
						<label for="bathrooms" class="mb-1 block text-xs font-medium text-gray-700"
							>Bathrooms</label
						>
						<p class="text-xs text-gray-900">{selectedProperty.bathrooms}</p>
					</div>
					<div>
						<label for="area" class="mb-1 block text-xs font-medium text-gray-700"
							>Square Feet</label
						>
						<p class="text-xs text-gray-900">{selectedProperty.squareFeet.toLocaleString()}</p>
					</div>
					<div>
						<label for="rentAmount" class="mb-1 block text-xs font-medium text-gray-700"
							>Monthly Rent</label
						>
						<p class="text-xs text-gray-900">{formatCurrency(selectedProperty.monthlyRent)}</p>
					</div>
					<div>
						<label for="deposit" class="mb-1 block text-xs font-medium text-gray-700"
							>Security Deposit</label
						>
						<p class="text-xs text-gray-900">{formatCurrency(selectedProperty.deposit)}</p>
					</div>
					<div>
						<label for="Availability" class="mb-1 block text-xs font-medium text-gray-700"
							>Availability</label
						>
						<p class="text-xs text-gray-900">
							{selectedProperty.isAvailable ? 'Available' : 'Occupied'}
						</p>
					</div>

					{#if selectedProperty.amenities.length > 0}
						<div class="md:col-span-2">
							<label for="Amenities" class="mb-2 block text-xs font-medium text-gray-700"
								>Amenities</label
							>
							<div class="flex flex-wrap gap-2">
								{#each selectedProperty.amenities as amenity (amenity)}
									<span class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
										{amenity}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if selectedProperty.images && selectedProperty.images.length > 0}
						<div class="md:col-span-2">
							<label for="property-images" class="mb-2 block text-xs font-medium text-gray-700">
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

					{#if selectedProperty.description}
						<div class="md:col-span-2">
							<label for="Description" class="mb-1 block text-xs font-medium text-gray-700"
								>Description</label
							>
							<p class="text-xs text-gray-900">{selectedProperty.description}</p>
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
