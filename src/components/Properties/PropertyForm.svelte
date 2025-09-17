<script lang="ts">
	import { generateId } from '../../utils/helpers';
	import { saveMultiplePropertyImages, deletePropertyImage } from '$lib/stores';
	import type { Property, PropertyImage } from '../../types';

	export let property: Property | undefined;
	export let onSave: (property: Property) => void;
	export let onCancel: () => void;

	const PROPERTY_TYPES = [
		{ value: 'apartment', label: 'Apartment' },
		{ value: 'house', label: 'House' },
		{ value: 'garage', label: 'Garage' },
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
		images: [] as PropertyImage[], // Add images field
		propertyType: 'apartment' as Property['propertyType'],
		bedrooms: 1,
		bathrooms: 1,
		squareFeet: 0,
		monthlyRent: 0,
		deposit: 0,
		amenities: [] as string[],
		description: '',
		isAvailable: true
	};

	let errors: Partial<Record<keyof typeof formData, string>> = {};
	let uploadingImages = false;
	let imageUploadError = '';

	$: {
		if (property) {
			formData = {
				address: property.address,
				city: property.city,
				state: property.state,
				zipCode: property.zipCode,
				images: property.images || [],
				propertyType: property.propertyType,
				bedrooms: property.bedrooms,
				bathrooms: property.bathrooms,
				squareFeet: property.squareFeet,
				monthlyRent: property.monthlyRent,
				deposit: property.deposit,
				amenities: property.amenities,
				description: property.description,
				isAvailable: property.isAvailable
			};
		}
	}

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof typeof formData, string>> = {};

		if (!formData.address.trim()) newErrors.address = 'Address is required';
		if (!formData.city.trim()) newErrors.city = 'City is required';
		if (!formData.state.trim()) newErrors.state = 'State is required';
		if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
		if (formData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms must be 0 or greater';
		if (formData.bathrooms <= 0) newErrors.bathrooms = 'Bathrooms must be greater than 0';
		if (formData.squareFeet <= 0) newErrors.squareFeet = 'Square feet must be greater than 0';
		if (formData.monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
		if (formData.deposit < 0) newErrors.deposit = 'Deposit must be 0 or greater';

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
			// Generate property ID if this is a new property
			const propertyId = property?.id || generateId();

			// Save images to local storage
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
			// Clear the input
			(e.target as HTMLInputElement).value = '';
		}
	}

	async function handleRemoveImage(imageToRemove: PropertyImage) {
		try {
			// Remove from local storage
			await deletePropertyImage(imageToRemove.path);

			// Remove from form data
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

	function handleAmenityChange(amenity: string) {
		formData = {
			...formData,
			amenities: formData.amenities.includes(amenity)
				? formData.amenities.filter((a) => a !== amenity)
				: [...formData.amenities, amenity]
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
			<label for="bedrooms" class="mb-2 block text-xs font-medium text-gray-700">
				Bedrooms *
			</label>
			<input
				type="number"
				min="0"
				bind:value={formData.bedrooms}
				on:input={handleChange('bedrooms')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.bedrooms ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.bedrooms}<p class="mt-1 text-xs text-red-500">{errors.bedrooms}</p>{/if}
		</div>

		<div>
			<label for="bathrooms" class="mb-2 block text-xs font-medium text-gray-700">
				Bathrooms *
			</label>
			<input
				type="number"
				min="0.5"
				step="0.5"
				bind:value={formData.bathrooms}
				on:input={handleChange('bathrooms')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.bathrooms ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.bathrooms}<p class="mt-1 text-xs text-red-500">{errors.bathrooms}</p>{/if}
		</div>

		<div>
			<label for="squareFeet" class="mb-2 block text-xs font-medium text-gray-700">
				Square Feet *
			</label>
			<input
				type="number"
				min="1"
				bind:value={formData.squareFeet}
				on:input={handleChange('squareFeet')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.squareFeet ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.squareFeet}<p class="mt-1 text-xs text-red-500">{errors.squareFeet}</p>{/if}
		</div>

		<div>
			<label for="monthlyRent" class="mb-2 block text-xs font-medium text-gray-700">
				Monthly Rent *
			</label>
			<input
				type="number"
				min="0"
				step="0.01"
				bind:value={formData.monthlyRent}
				on:input={handleChange('monthlyRent')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.monthlyRent ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.monthlyRent}<p class="mt-1 text-xs text-red-500">{errors.monthlyRent}</p>{/if}
		</div>

		<div>
			<label for="deposit" class="mb-2 block text-xs font-medium text-gray-700">
				Security Deposit *
			</label>
			<input
				type="number"
				min="0"
				step="0.01"
				bind:value={formData.deposit}
				on:input={handleChange('deposit')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.deposit ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.deposit}<p class="mt-1 text-xs text-red-500">{errors.deposit}</p>{/if}
		</div>

		<div class="md:col-span-2">
			<label for="Amenities" class="mb-2 block text-xs font-medium text-gray-700">
				Amenities
			</label>
			<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
				{#each COMMON_AMENITIES as amenity (amenity)}
					<label class="flex items-center space-x-2">
						<input
							type="checkbox"
							checked={formData.amenities.includes(amenity)}
							on:change={() => handleAmenityChange(amenity)}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-xs text-gray-700">{amenity}</span>
					</label>
				{/each}
			</div>
		</div>

		<div class="md:col-span-2">
			<label for="Description" class="mb-2 block text-xs font-medium text-gray-700">
				Description
			</label>
			<textarea
				bind:value={formData.description}
				on:input={handleChange('description')}
				rows={4}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
			</textarea>
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
