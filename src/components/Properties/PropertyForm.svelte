<script lang="ts">
	import { generateId } from '../../utils/helpers';
	import { saveMultiplePropertyImages, deletePropertyImage } from '$lib/stores';
	import type { Property, PropertyImage, Unit } from '../../types';

	export let property: Property | undefined;
	export let onSave: (property: Property) => void;
	export let onCancel: () => void;

	const PROPERTY_TYPES = [
		{ value: 'complex', label: 'Complex' },
		{ value: 'house', label: 'House' },
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'commercial', label: 'Commercial' }
	] as const;

	const COMMON_AMENITIES = [
		'Air Conditioning',
		'Heating',
		'Parking',
		'Balcony',
		'Laundry',
		'Dishwasher',
		'Swimming Pool',
		'Gym',
		'Garden',
		'Storage'
	];

	let formData = {
		address: '',
		city: '',
		state: '',
		zipCode: '',
		propertyType: 'complex' as Property['propertyType'],
		name: '',
		description: '',
		images: [] as PropertyImage[],
		isAvailable: true,
		units: [] as Unit[]
	};

	let errors: Partial<Record<keyof typeof formData | 'units', string>> = {};
	let uploadingImages = false;
	let imageUploadError = '';
	let showUnits = false;

	$: {
		if (property) {
			formData = {
				address: property.address,
				city: property.city,
				state: property.state,
				zipCode: property.zipCode,
				propertyType: property.propertyType,
				name: property.name || '',
				description: property.description,
				images: property.images || [],
				isAvailable: property.isAvailable,
				units: property.units || []
			};
		}
	}

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof typeof formData | 'units', string>> = {};

		if (!formData.address.trim()) newErrors.address = 'Address is required';
		if (!formData.city.trim()) newErrors.city = 'City is required';
		if (!formData.state.trim()) newErrors.state = 'State is required';
		if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
		if (!formData.description.trim()) newErrors.description = 'Description is required';

		// Validate units
		if (formData.units.length === 0) {
			newErrors.units = 'At least one unit is required';
		} else {
			const hasInvalidUnit = formData.units.some(
				(unit) =>
					!unit.unitNumber.trim() ||
					unit.bedrooms < 0 ||
					unit.bathrooms <= 0 ||
					unit.squareFeet <= 0 ||
					unit.monthlyRent <= 0 ||
					unit.deposit < 0
			);
			if (hasInvalidUnit) {
				newErrors.units = 'All units must have valid data';
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validateForm()) return;

		const now = new Date().toISOString();
		const propertyId = property?.id || generateId();

		const propertyData: Property = {
			id: propertyId,
			...formData,
			leases: property?.leases || [],
			createdAt: property?.createdAt || now,
			updatedAt: now
		};

		onSave(propertyData);
	}

	async function handleImageUpload(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files || files.length === 0) return;

		uploadingImages = true;
		imageUploadError = '';

		try {
			const propertyId = property?.id || generateId();
			const savedImages = await saveMultiplePropertyImages(files, propertyId);

			if (savedImages.length > 0) {
				formData = {
					...formData,
					images: [...formData.images, ...savedImages]
				};
				console.log(`Successfully uploaded ${savedImages.length} images`);
			} else {
				imageUploadError = 'No images were successfully uploaded';
			}
		} catch (error) {
			console.error('Error uploading images:', error);
			imageUploadError = 'Failed to upload images. Please try again.';
		} finally {
			uploadingImages = false;
			(e.target as HTMLInputElement).value = '';
		}
	}

	async function handleRemoveImage(imageToRemove: PropertyImage) {
		try {
			await deletePropertyImage(imageToRemove.path);
			formData = {
				...formData,
				images: formData.images.filter((img) => img.id !== imageToRemove.id)
			};
		} catch (error) {
			console.error('Error removing image:', error);
		}
	}

	function handleChange(field: keyof typeof formData) {
		return (e: Event) => {
			const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
			const value =
				target.type === 'checkbox'
					? (target as HTMLInputElement).checked
					: target.type === 'number'
						? Number(target.value)
						: target.value;

			formData = { ...formData, [field]: value };
			if (errors[field]) {
				errors = { ...errors, [field]: '' };
			}
		};
	}

	function addUnit() {
		const newUnit: Unit = {
			id: generateId(),
			unitNumber: '',
			bedrooms: 1,
			bathrooms: 1,
			squareFeet: 0,
			monthlyRent: 0,
			deposit: 0,
			description: '',
			amenities: [],
			images: [],
			isAvailable: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		formData = {
			...formData,
			units: [...formData.units, newUnit]
		};
	}

	function removeUnit(unitId: string) {
		formData = {
			...formData,
			units: formData.units.filter((unit) => unit.id !== unitId)
		};
	}

	function updateUnit(unitId: string, field: keyof Unit, value: any) {
		formData = {
			...formData,
			units: formData.units.map((unit) =>
				unit.id === unitId ? { ...unit, [field]: value, updatedAt: new Date().toISOString() } : unit
			)
		};
	}

	function handleUnitAmenityChange(unitId: string, amenity: string) {
		formData = {
			...formData,
			units: formData.units.map((unit) =>
				unit.id === unitId
					? {
							...unit,
							amenities: unit.amenities.includes(amenity)
								? unit.amenities.filter((a) => a !== amenity)
								: [...unit.amenities, amenity],
							updatedAt: new Date().toISOString()
						}
					: unit
			)
		};
	}
</script>

<form on:submit={handleSubmit} class="space-y-6 p-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="md:col-span-2">
			<label for="address" class="mb-2 block text-xs font-medium text-gray-700"> Address * </label>
			<input
				type="text"
				bind:value={formData.address}
				on:input={handleChange('address')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.address ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.address}<p class="mt-1 text-xs text-red-500">{errors.address}</p>{/if}
		</div>

		<div>
			<label for="name" class="mb-2 block text-xs font-medium text-gray-700"> Property Name </label>
			<input
				type="text"
				bind:value={formData.name}
				on:input={handleChange('name')}
				placeholder="e.g., The Grand Apartments"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="propertyType" class="mb-2 block text-xs font-medium text-gray-700">
				Property Type *
			</label>
			<select
				bind:value={formData.propertyType}
				on:change={handleChange('propertyType')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
				{#each PROPERTY_TYPES as type (type.value)}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="city" class="mb-2 block text-xs font-medium text-gray-700"> City * </label>
			<input
				type="text"
				bind:value={formData.city}
				on:input={handleChange('city')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.city ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.city}<p class="mt-1 text-xs text-red-500">{errors.city}</p>{/if}
		</div>

		<div>
			<label for="state" class="mb-2 block text-xs font-medium text-gray-700"> State * </label>
			<input
				type="text"
				bind:value={formData.state}
				on:input={handleChange('state')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.state ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.state}<p class="mt-1 text-xs text-red-500">{errors.state}</p>{/if}
		</div>

		<div>
			<label for="zipCode" class="mb-2 block text-xs font-medium text-gray-700"> ZIP Code * </label>
			<input
				type="text"
				bind:value={formData.zipCode}
				on:input={handleChange('zipCode')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.zipCode ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.zipCode}<p class="mt-1 text-xs text-red-500">{errors.zipCode}</p>{/if}
		</div>

		<div class="md:col-span-2">
			<label for="description" class="mb-2 block text-xs font-medium text-gray-700">
				Description *
			</label>
			<textarea
				bind:value={formData.description}
				on:input={handleChange('description')}
				rows={4}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.description ? 'border-red-300' : 'border-gray-300'
				}`}
			></textarea>
			{#if errors.description}<p class="mt-1 text-xs text-red-500">{errors.description}</p>{/if}
		</div>

		<div class="md:col-span-2">
			<label for="images" class="mb-2 block text-xs font-medium text-gray-700">
				Property Images
			</label>

			<input
				type="file"
				multiple
				accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
				on:change={handleImageUpload}
				disabled={uploadingImages}
				class={`w-full rounded-lg border border-gray-300 px-3 py-2 ${
					uploadingImages ? 'cursor-not-allowed opacity-50' : ''
				}`}
			/>

			{#if uploadingImages}
				<p class="mt-2 text-xs text-blue-600">Uploading images...</p>
			{/if}

			{#if imageUploadError}
				<p class="mt-2 text-xs text-red-500">{imageUploadError}</p>
			{/if}

			{#if formData.images.length > 0}
				<div class="mt-4 space-y-2">
					<p class="text-xs font-medium text-gray-700">
						Uploaded Images ({formData.images.length}):
					</p>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
						{#each formData.images as img (img.id)}
							<div class="relative rounded border border-gray-200 bg-gray-50 p-2">
								<div class="truncate text-xs text-gray-600">{img.filename}</div>
								<div class="text-xs text-gray-400">
									{new Date(img.uploadedAt).toLocaleDateString()}
								</div>
								<button
									type="button"
									on:click={() => handleRemoveImage(img)}
									class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
									title="Remove image"
								>
									×
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Units Section -->
	<div class="border-t border-gray-200 pt-6">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h3 class="text-lg font-medium text-gray-900">Units *</h3>
				<p class="text-xs text-gray-600">Add units for this property</p>
			</div>
			<button
				type="button"
				on:click={addUnit}
				class="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
			>
				Add Unit
			</button>
		</div>

		{#if errors.units}<p class="mb-4 text-xs text-red-500">{errors.units}</p>{/if}

		{#if formData.units.length === 0}
			<div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
				<p class="text-xs text-gray-500">No units added yet. Click "Add Unit" to get started.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each formData.units as unit, index (unit.id)}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<div class="mb-3 flex items-center justify-between">
							<h4 class="font-medium text-gray-900">Unit {index + 1}</h4>
							<button
								type="button"
								on:click={() => removeUnit(unit.id)}
								class="text-xs text-red-600 hover:text-red-800"
							>
								Remove
							</button>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Unit Number *</label>
								<input
									type="text"
									bind:value={unit.unitNumber}
									on:input={(e) =>
										updateUnit(unit.id, 'unitNumber', (e.target as HTMLInputElement).value)}
									placeholder="e.g., 1A, Unit 203"
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Bedrooms *</label>
								<input
									type="number"
									min="0"
									bind:value={unit.bedrooms}
									on:input={(e) =>
										updateUnit(unit.id, 'bedrooms', Number((e.target as HTMLInputElement).value))}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Bathrooms *</label>
								<input
									type="number"
									min="0.5"
									step="0.5"
									bind:value={unit.bathrooms}
									on:input={(e) =>
										updateUnit(unit.id, 'bathrooms', Number((e.target as HTMLInputElement).value))}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Square Feet *</label>
								<input
									type="number"
									min="1"
									bind:value={unit.squareFeet}
									on:input={(e) =>
										updateUnit(unit.id, 'squareFeet', Number((e.target as HTMLInputElement).value))}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700">Monthly Rent *</label>
								<input
									type="number"
									min="0"
									step="0.01"
									bind:value={unit.monthlyRent}
									on:input={(e) =>
										updateUnit(
											unit.id,
											'monthlyRent',
											Number((e.target as HTMLInputElement).value)
										)}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs font-medium text-gray-700"
									>Security Deposit *</label
								>
								<input
									type="number"
									min="0"
									step="0.01"
									bind:value={unit.deposit}
									on:input={(e) =>
										updateUnit(unit.id, 'deposit', Number((e.target as HTMLInputElement).value))}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								/>
							</div>

							<div class="md:col-span-3">
								<label class="mb-1 block text-xs font-medium text-gray-700">Unit Description</label>
								<textarea
									bind:value={unit.description}
									on:input={(e) =>
										updateUnit(unit.id, 'description', (e.target as HTMLTextAreaElement).value)}
									rows={2}
									class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
								></textarea>
							</div>

							<div class="md:col-span-3">
								<label class="mb-2 block text-xs font-medium text-gray-700">Unit Amenities</label>
								<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
									{#each COMMON_AMENITIES as amenity (amenity)}
										<label class="flex items-center space-x-2">
											<input
												type="checkbox"
												checked={unit.amenities.includes(amenity)}
												on:change={() => handleUnitAmenityChange(unit.id, amenity)}
												class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span class="text-xs text-gray-700">{amenity}</span>
										</label>
									{/each}
								</div>
							</div>

							<div class="md:col-span-3">
								<label class="flex items-center space-x-2">
									<input
										type="checkbox"
										bind:checked={unit.isAvailable}
										on:change={(e) =>
											updateUnit(unit.id, 'isAvailable', (e.target as HTMLInputElement).checked)}
										class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-xs text-gray-700">Unit is available</span>
								</label>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex justify-end space-x-3 border-t border-gray-200 pt-6">
		<button
			type="button"
			on:click={onCancel}
			class="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			type="submit"
			disabled={uploadingImages}
			class={`rounded-lg px-4 py-2 text-white transition-colors ${
				uploadingImages ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
			}`}
		>
			{property ? 'Update Property' : 'Create Property'}
		</button>
	</div>
</form>
