<script lang="ts">
	import { generateId, validateEmail, validatePhone } from '../../utils/helpers';
	import type { Tenant } from '../../types';

	export let tenant: Tenant | undefined;
	export let onSave: (tenant: Tenant) => void;
	export let onCancel: () => void;

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		address: '',
		dateOfBirth: '',
		emergencyContact: '',
		emergencyPhone: ''
	};

	let errors: Partial<typeof formData> = {};

	$: {
		if (tenant) {
			formData = {
				firstName: tenant.firstName,
				lastName: tenant.lastName,
				email: tenant.email,
				phone: tenant.phone,
				address: tenant.address,
				dateOfBirth: tenant.dateOfBirth,
				emergencyContact: tenant.emergencyContact,
				emergencyPhone: tenant.emergencyPhone
			};
		}
	}

	function validateForm(): boolean {
		const newErrors: Partial<typeof formData> = {};

		if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
		if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
		if (!formData.email.trim()) newErrors.email = 'Email is required';
		else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
		if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
		else if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone format';
		if (!formData.address.trim()) newErrors.address = 'Address is required';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validateForm()) return;

		const now = new Date().toISOString();
		const tenantData: Tenant = {
			id: tenant?.id || generateId(),
			...formData,
			createdAt: tenant?.createdAt || now,
			updatedAt: now
		};

		onSave(tenantData);
	}

	function handleChange(field: keyof typeof formData) {
		return (e: Event) => {
			formData = { ...formData, [field]: (e.target as HTMLInputElement).value };
			if (errors[field]) {
				errors = { ...errors, [field]: '' };
			}
		};
	}
</script>

<form on:submit={handleSubmit} class="space-y-6 p-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div>
			<label for="firstName" class="mb-2 block text-xs font-medium text-gray-700">
				First Name *
			</label>
			<input
				type="text"
				bind:value={formData.firstName}
				on:input={handleChange('firstName')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.firstName ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.firstName}<p class="mt-1 text-xs text-red-500">{errors.firstName}</p>{/if}
		</div>

		<div>
			<label for="lastName" class="mb-2 block text-xs font-medium text-gray-700">
				Last Name *
			</label>
			<input
				id="lastName"
				type="text"
				bind:value={formData.lastName}
				on:input={handleChange('lastName')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.lastName ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.lastName}<p class="mt-1 text-xs text-red-500">{errors.lastName}</p>{/if}
		</div>

		<div>
			<label for="email" class="mb-2 block text-xs font-medium text-gray-700"> Email * </label>
			<input
				id="email"
				type="email"
				bind:value={formData.email}
				on:input={handleChange('email')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.email ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.email}<p class="mt-1 text-xs text-red-500">{errors.email}</p>{/if}
		</div>

		<div>
			<label for="tel" class="mb-2 block text-xs font-medium text-gray-700"> Phone * </label>
			<input
				id="tel"
				type="tel"
				bind:value={formData.phone}
				on:input={handleChange('phone')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.phone ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.phone}<p class="mt-1 text-xs text-red-500">{errors.phone}</p>{/if}
		</div>

		<div class="md:col-span-2">
			<label for="address" class="mb-2 block text-xs font-medium text-gray-700"> Address * </label>
			<textarea
				id="address"
				bind:value={formData.address}
				on:input={handleChange('address')}
				rows={3}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.address ? 'border-red-300' : 'border-gray-300'
				}`}
			>
			</textarea>
			{#if errors.address}<p class="mt-1 text-xs text-red-500">{errors.address}</p>{/if}
		</div>

		<div>
			<label for="dateOfBirth" class="mb-2 block text-xs font-medium text-gray-700">
				Date of Birth
			</label>
			<input
				id="dateOfBirth"
				type="date"
				bind:value={formData.dateOfBirth}
				on:input={handleChange('dateOfBirth')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="emergencyContact" class="mb-2 block text-xs font-medium text-gray-700">
				Emergency Contact
			</label>
			<input
				id="emergencyContact"
				type="text"
				bind:value={formData.emergencyContact}
				on:input={handleChange('emergencyContact')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="md:col-span-2">
			<label for="emergencyPhone" class="mb-2 block text-xs font-medium text-gray-700">
				Emergency Phone
			</label>
			<input
				type="tel"
				bind:value={formData.emergencyPhone}
				on:input={handleChange('emergencyPhone')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
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
			class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			{tenant ? 'Update Tenant' : 'Create Tenant'}
		</button>
	</div>
</form>
