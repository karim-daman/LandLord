<script lang="ts">
	import { generateId } from '../../utils/helpers';
	import type { LeaseAgreement, Client, Property } from '../../types';

	export let lease: LeaseAgreement | undefined;
	export let clients: Client[];
	export let properties: Property[];
	export let onSave: (lease: LeaseAgreement) => void;
	export let onCancel: () => void;

	const LEASE_STATUSES = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'active', label: 'Active' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'terminated', label: 'Terminated' }
	] as const;

	let formData = {
		clientId: '',
		propertyId: '',
		startDate: '',
		endDate: '',
		monthlyRent: 0,
		securityDeposit: 0,
		status: 'pending' as LeaseAgreement['status'],
		terms: '',
		specialConditions: '',
		signedDate: ''
	};

	let errors: Partial<Record<keyof typeof formData, string>> = {};

	$: {
		if (lease) {
			formData = {
				clientId: lease.clientId,
				propertyId: lease.propertyId,
				startDate: lease.startDate,
				endDate: lease.endDate,
				monthlyRent: lease.monthlyRent,
				securityDeposit: lease.securityDeposit,
				status: lease.status,
				terms: lease.terms,
				specialConditions: lease.specialConditions,
				signedDate: lease.signedDate
			};
		}
	}

	$: if (formData.propertyId && !lease) {
		const selectedProperty = properties.find((p) => p.id === formData.propertyId);
		if (selectedProperty) {
			formData = {
				...formData,
				monthlyRent: selectedProperty.monthlyRent,
				securityDeposit: selectedProperty.deposit
			};
		}
	}

	// This is the updated line to prevent the TypeError
	$: availableProperties =
		properties && Array.isArray(properties)
			? properties.filter((p) => p.isAvailable || p.id === formData.propertyId)
			: [];

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof typeof formData, string>> = {};

		if (!formData.clientId) newErrors.clientId = 'Client is required';
		if (!formData.propertyId) newErrors.propertyId = 'Property is required';
		if (!formData.startDate) newErrors.startDate = 'Start date is required';
		if (!formData.endDate) newErrors.endDate = 'End date is required';
		if (formData.monthlyRent <= 0) newErrors.monthlyRent = 'Monthly rent must be greater than 0';
		if (formData.securityDeposit < 0)
			newErrors.securityDeposit = 'Security deposit must be 0 or greater';

		if (formData.startDate && formData.endDate) {
			const start = new Date(formData.startDate);
			const end = new Date(formData.endDate);
			if (end <= start) {
				newErrors.endDate = 'End date must be after start date';
			}
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!validateForm()) return;

		const now = new Date().toISOString();
		const leaseData: LeaseAgreement = {
			id: lease?.id || generateId(),
			...formData,
			createdAt: lease?.createdAt || now,
			updatedAt: now
		};

		onSave(leaseData);
	}

	function handleChange(field: keyof typeof formData) {
		return (e: Event) => {
			const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
			const value = target.type === 'number' ? Number(target.value) : target.value;
			formData = { ...formData, [field]: value };
			if (errors[field]) {
				errors = { ...errors, [field]: '' };
			}
		};
	}
</script>

<form on:submit={handleSubmit} class="space-y-6 p-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div>
			<label for="clientId" class="mb-2 block text-xs font-medium text-gray-700"> Client * </label>
			<select
				bind:value={formData.clientId}
				on:change={handleChange('clientId')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.clientId ? 'border-red-300' : 'border-gray-300'
				}`}
			>
				<option value="">Select a client</option>
				{#each clients as client (client.id)}
					<option value={client.id}>
						{client.firstName}
						{client.lastName}
					</option>
				{/each}
			</select>
			{#if errors.clientId}<p class="mt-1 text-xs text-red-500">{errors.clientId}</p>{/if}
		</div>

		<div>
			<label for="Property" class="mb-2 block text-xs font-medium text-gray-700">
				Property *
			</label>
			<select
				bind:value={formData.propertyId}
				on:change={handleChange('propertyId')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.propertyId ? 'border-red-300' : 'border-gray-300'
				}`}
			>
				<option value="">Select a property</option>
				{#each availableProperties as property (property.id)}
					<option value={property.id}>
						{property.address}
					</option>
				{/each}
			</select>
			{#if errors.propertyId}<p class="mt-1 text-xs text-red-500">{errors.propertyId}</p>{/if}
		</div>

		<div>
			<label for="startDate" class="mb-2 block text-xs font-medium text-gray-700">
				Start Date *
			</label>
			<input
				type="date"
				bind:value={formData.startDate}
				on:change={handleChange('startDate')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.startDate ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.startDate}<p class="mt-1 text-xs text-red-500">{errors.startDate}</p>{/if}
		</div>

		<div>
			<label for="endDate" class="mb-2 block text-xs font-medium text-gray-700"> End Date * </label>
			<input
				type="date"
				bind:value={formData.endDate}
				on:change={handleChange('endDate')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.endDate ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.endDate}<p class="mt-1 text-xs text-red-500">{errors.endDate}</p>{/if}
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
				on:change={handleChange('monthlyRent')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.monthlyRent ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.monthlyRent}<p class="mt-1 text-xs text-red-500">{errors.monthlyRent}</p>{/if}
		</div>

		<div>
			<label for="securityDeposit" class="mb-2 block text-xs font-medium text-gray-700">
				Security Deposit *
			</label>
			<input
				type="number"
				min="0"
				step="0.01"
				bind:value={formData.securityDeposit}
				on:change={handleChange('securityDeposit')}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.securityDeposit ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.securityDeposit}<p class="mt-1 text-xs text-red-500">
					{errors.securityDeposit}
				</p>{/if}
		</div>

		<div>
			<label for="status" class="mb-2 block text-xs font-medium text-gray-700"> Status * </label>
			<select
				bind:value={formData.status}
				on:change={handleChange('status')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
				{#each LEASE_STATUSES as status (status.value)}
					<option value={status.value}>
						{status.label}
					</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="signedDate" class="mb-2 block text-xs font-medium text-gray-700">
				Signed Date
			</label>
			<input
				type="date"
				bind:value={formData.signedDate}
				on:change={handleChange('signedDate')}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="md:col-span-2">
			<label for="terms" class="mb-2 block text-xs font-medium text-gray-700"> Lease Terms </label>
			<textarea
				bind:value={formData.terms}
				on:change={handleChange('terms')}
				rows={4}
				placeholder="Standard lease terms and conditions..."
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
			</textarea>
		</div>

		<div class="md:col-span-2">
			<label for="specialConditions" class="mb-2 block text-xs font-medium text-gray-700">
				Special Conditions
			</label>
			<textarea
				bind:value={formData.specialConditions}
				on:change={handleChange('specialConditions')}
				rows={3}
				placeholder="Any special conditions or requirements..."
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			>
			</textarea>
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
			{lease ? 'Update Lease' : 'Create Lease'}
		</button>
	</div>
</form>
