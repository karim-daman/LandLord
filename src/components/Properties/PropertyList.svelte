<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import PropertyForm from './PropertyForm.svelte';
	import { formatCurrency } from '../../utils/helpers';
	import { getImageAsBase64, leaseAgreements, tenants } from '$lib/stores';
	import type { Property, LeaseAgreement } from '../../types';
	import { onMount } from 'svelte';

	import {
		eye,
		edit,
		mappin,
		trash,
		home,
		dollarsign,
		plus,
		building2,
		up,
		down
	} from '../Icons/icons';

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
	let showLeaseAgreements = false;

	// The type for this variable is now inferred, removing the need for a separate interface.
	let propertyLeaseAgreements: LeaseAgreement[] = [];

	const filterOptions = [
		{ value: 'complex', label: 'Complex' },
		{ value: 'house', label: 'House' },
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'commercial', label: 'Commercial' }
	];

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

	// Reactive statement to filter lease agreements for the selected property and enrich them with tenant data
	$: {
		if (selectedProperty && $leaseAgreements && $tenants) {
			propertyLeaseAgreements = $leaseAgreements.filter(
				(agreement) => agreement.propertyId === selectedProperty?.id
			);
		} else {
			propertyLeaseAgreements = [];
		}
	}

	onMount(async () => {
		await loadCardImages();
	});

	$: if (properties) {
		loadCardImages();
	}

	async function loadCardImages() {
		const newImageDataUrls: { [key: string]: string } = {};
		const newCardImageIndexes: { [key: string]: number } = {};

		try {
			await Promise.all(
				properties.map(async (property) => {
					newCardImageIndexes[property.id] = 0;

					if (!property.images || property.images.length === 0) return;

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
		showLeaseAgreements = false;

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
		propertyLeaseAgreements = [];
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
			{@html plus} <span>Add Property</span>
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
				{#if property.images?.length > 0}
					{@const currentImageIndex = cardImageIndexes[property.id] || 0}
					{@const currentImage = property.images[currentImageIndex]}
					<div class="relative h-48 bg-gray-200">
						{#if currentImage && imageDataUrls[currentImage.id]}
							<img
								src={imageDataUrls[currentImage.id]}
								alt={currentImage.caption || currentImage.filename}
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
								><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/></svg
								></button
							>
							<button
								on:click={() => nextImage(property.id, property.images.length)}
								class="absolute top-1/2 right-2 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
								aria-label="Next image"
								><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/></svg
								></button
							>
							<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
								{#each property.images as _, index}
									<button
										on:click={() => setImageIndex(property.id, index)}
										class={`h-2 w-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
										aria-label={`Go to image ${index + 1}`}
									></button>
								{/each}
							</div>
							<div
								class="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
							>
								{currentImageIndex + 1}/{property.images.length}
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
									class={`rounded-full px-2 py-1 text-xs font-medium ${getAvailableUnitsCount(property) > 0 ? 'border border-green-200 bg-green-100 text-green-800' : 'border border-red-200 bg-red-100 text-red-800'}`}
									>{getAvailableUnitsCount(property)}/{getTotalUnitsCount(property)} Available</span
								>
								<span
									class="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 capitalize"
									>{property.propertyType}</span
								>
							</div>
							<h3 class="line-clamp-2 text-lg font-semibold text-gray-900">
								{property.name || property.address}
							</h3>
							{#if property.name}<p class="text-xs text-gray-600">{property.address}</p>{/if}
						</div>
						<div class="ml-2 flex space-x-2">
							<button
								on:click={() => handleView(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
								title="View Details">{@html eye}</button
							>
							<button
								on:click={() => handleEdit(property)}
								class="p-1 text-gray-400 transition-colors hover:text-teal-600"
								title="Edit Property">{@html edit}</button
							>
							<button
								on:click={() => handleDelete(property)}
								class="p-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Property">{@html trash}</button
							>
						</div>
					</div>
					<div class="space-y-3">
						<div class="flex items-center text-xs text-gray-600">
							{@html mappin}<span class="truncate"
								>{property.city}, {property.state} {property.zipCode}</span
							>
						</div>
						<div class="flex items-center text-xs text-gray-600">
							{@html building2}<span>{getTotalUnitsCount(property)} units total</span>
						</div>
						<div class="flex items-center text-xs font-medium text-gray-900">
							{@html dollarsign}<span>{getPropertyRentRange(property)}/month</span>
						</div>
					</div>
					{#if property.description}<div class="mt-4">
							<p class="line-clamp-2 text-xs text-gray-600">{property.description}</p>
						</div>{/if}
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
				<h3 class="text-sm font-bold text-gray-700">Property Details</h3>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="md:col-span-2">
						<div class="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">Property Name</label>
								<p class="text-sm text-gray-900">{selectedProperty.name || 'N/A'}</p>
							</div>
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">Address</label>
								<p class="text-sm text-gray-900">{selectedProperty.address}</p>
							</div>
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">City</label>
								<p class="text-sm text-gray-900">{selectedProperty.city}</p>
							</div>
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">State</label>
								<p class="text-sm text-gray-900">{selectedProperty.state}</p>
							</div>
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">ZIP Code</label>
								<p class="text-sm text-gray-900">{selectedProperty.zipCode}</p>
							</div>
							<div>
								<label for="" class="block text-xs font-medium text-gray-700">Property Type</label>
								<p class="text-sm text-gray-900 capitalize">{selectedProperty.propertyType}</p>
							</div>
						</div>
					</div>

					{#if selectedProperty.description}
						<div class="md:col-span-2">
							<label for="" class="block text-xs font-medium text-gray-700">Description</label>
							<p class="text-sm text-gray-900">{selectedProperty.description}</p>
						</div>
					{/if}

					<div class="md:col-span-2">
						<label for="" class="block text-sm font-medium text-gray-900"
							>Units ({selectedProperty.units.length})</label
						>
						{#if selectedProperty.units && selectedProperty.units.length > 0}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each selectedProperty.units as unit (unit.id)}
									<div class="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm">
										<span class="font-bold text-gray-700">Unit {unit.unitNumber}:</span>
										<span class="text-gray-900"
											>{unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''} / {unit.bathrooms} bath{unit.bathrooms !==
											1
												? 's'
												: ''}</span
										>
										<span class="ml-4 font-bold text-gray-700">Rent:</span>
										<span class="text-gray-900">{formatCurrency(unit.monthlyRent)}</span>
										<span class="ml-4 font-bold text-gray-700">Status:</span>
										<span
											class={`font-medium ${unit.isAvailable ? 'text-green-600' : 'text-red-600'}`}
										>
											{unit.isAvailable ? 'Available' : 'Occupied'}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="rounded-md border border-gray-300 p-2 md:col-span-2">
						<h3 class="mb-2 flex items-center justify-between text-lg font-bold text-gray-900">
							<span>Lease History</span>
							{#if propertyLeaseAgreements.length > 0}
								<button
									on:click={() => (showLeaseAgreements = !showLeaseAgreements)}
									class="rounded-md border border-gray-300 p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
								>
									{@html showLeaseAgreements ? up : down}
								</button>
							{/if}
						</h3>
						{#if propertyLeaseAgreements.length > 0}
							<div
								class="overflow-hidden overflow-y-auto transition-[max-height] duration-500 ease-in-out"
								style={`max-height: ${showLeaseAgreements ? '500px' : '0px'}`}
							>
								<div class="space-y-4 pt-2">
									{#each propertyLeaseAgreements as agreement (agreement.id)}
										<div
											class="rounded-xl border border-gray-300 bg-white p-6 shadow-md transition-all hover:shadow-lg"
										>
											<!-- Header Section -->
											<div
												class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4"
											>
												<div>
													<h3 class="text-lg font-bold text-gray-900">
														Lease for Unit:
														<!-- {agreement.unitNumber} -->

														{selectedProperty?.units.find((u) => u.id === agreement.unitId)
															?.unitNumber}
													</h3>
													<p class="mt-1 text-sm text-gray-500">
														Created on {new Date(
															agreement.createdAt || agreement.signedDate
														).toLocaleDateString()}
													</p>
												</div>
												<span
													class="rounded-full px-3 py-1 text-sm font-medium {new Date() <
													new Date(agreement.endDate)
														? 'bg-green-100 text-green-800'
														: 'bg-red-100 text-red-800'}"
												>
													{agreement.status}
												</span>
											</div>

											<!-- Tenant Information -->
											<div class="mt-5">
												<h4 class="mb-3 flex items-center text-base font-semibold text-gray-800">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="mr-2 h-5 w-5 text-blue-600"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
														/>
													</svg>
													Tenant Information
												</h4>
												<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
													<div class="space-y-2">
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Name:</span>
															<span class="text-gray-800">
																{$tenants.find((tenant) => tenant.id === agreement.tenantId)
																	?.firstName}
																{$tenants.find((tenant) => tenant.id === agreement.tenantId)
																	?.lastName}
															</span>
														</div>
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Email:</span>
															<a
																href="mailto:{$tenants.find(
																	(tenant) => tenant.id === agreement.tenantId
																)?.email}"
																class="text-blue-600 hover:underline"
															>
																{$tenants.find((tenant) => tenant.id === agreement.tenantId)?.email}
															</a>
														</div>
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Phone:</span>
															<a
																href="tel:{$tenants.find(
																	(tenant) => tenant.id === agreement.tenantId
																)?.phone}"
																class="text-gray-800"
															>
																{$tenants.find((tenant) => tenant.id === agreement.tenantId)?.phone}
															</a>
														</div>
													</div>
												</div>
											</div>

											<!-- Lease Details -->
											<div class="mt-6">
												<h4 class="mb-3 flex items-center text-base font-semibold text-gray-800">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="mr-2 h-5 w-5 text-blue-600"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													Lease Details
												</h4>
												<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
													<div class="space-y-2">
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Dates:</span>
															<span class="text-gray-800">
																{new Date(agreement.startDate).toLocaleDateString()} - {new Date(
																	agreement.endDate
																).toLocaleDateString()}
															</span>
														</div>
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700"
																>Monthly Rent:</span
															>
															<span class="text-gray-800"
																>{formatCurrency(agreement.monthlyRent)}</span
															>
														</div>
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Deposit:</span>
															<span class="text-gray-800"
																>{formatCurrency(agreement.securityDeposit)}</span
															>
														</div>
													</div>
													<div class="space-y-2">
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700"
																>Signed Date:</span
															>
															<span class="text-gray-800"
																>{new Date(agreement.signedDate).toLocaleDateString()}</span
															>
														</div>
														<div class="flex">
															<span class="min-w-[120px] font-medium text-gray-700">Terms:</span>
															<span class="text-gray-800">{agreement.terms}</span>
														</div>
													</div>
												</div>
											</div>

											<!-- Special Conditions -->
											{#if agreement.specialConditions}
												<div class="mt-6">
													<h4 class="mb-2 flex items-center text-base font-semibold text-gray-800">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="mr-2 h-5 w-5 text-blue-600"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
															/>
														</svg>
														Special Conditions
													</h4>
													<div class="rounded-lg border border-blue-100 bg-blue-50 p-4">
														<p class="text-gray-700">{agreement.specialConditions}</p>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<p class="text-sm text-gray-500">No lease agreements found for this property.</p>
						{/if}
					</div>
				</div>

				<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
					{#if selectedProperty.images && selectedProperty.images.length > 0}
						<div class="md:col-span-2">
							<h3 class="mb-2 text-lg font-bold text-gray-900">Images</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
								{#each selectedProperty.images as image (image.id)}
									<div class="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
										{#if imageDataUrls[image.id]}
											<img
												src={imageDataUrls[image.id]}
												alt={image.caption || image.filename}
												class="h-full w-full object-cover"
											/>
										{:else}
											<div class="flex h-full items-center justify-center bg-gray-200">
												<div class="text-center">
													<div
														class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
													></div>
													<div class="text-xs text-gray-500">Loading image...</div>
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</Modal>

	<Modal
		isOpen={showDeleteConfirm}
		onClose={() => (showDeleteConfirm = false)}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6 text-center">
			<h3 class="text-lg font-bold text-gray-900">
				Are you sure you want to delete this property?
			</h3>
			<p class="mt-2 text-sm text-gray-500">
				This action cannot be undone. All associated data will be permanently removed.
			</p>
			<div class="mt-6 flex justify-end space-x-3">
				<button
					on:click={() => (showDeleteConfirm = false)}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmDelete}
					class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
				>
					Delete
				</button>
			</div>
		</div>
	</Modal>
</div>
