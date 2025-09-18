<script lang="ts">
	import { generateId } from '../../utils/helpers';
	import type { LeaseAgreement, Tenant, Property, Unit } from '../../types';

	export let lease: LeaseAgreement | undefined;
	export let tenants: Tenant[];
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
		tenantId: '',
		propertyId: '',
		unitId: '',
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

	// Initialize formData when the lease prop is provided
	$: {
		if (lease) {
			formData = {
				tenantId: lease.tenantId,
				propertyId: lease.propertyId,
				unitId: lease.unitId || '',
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

	// Reactively determine selected property and available units
	$: selectedProperty = properties.find((p) => p.id === formData.propertyId);
	$: availableUnits = selectedProperty?.units || [];

	// Reset unitId if it's no longer valid for the new property
	// This is still needed, but it's not the cause of the loop.
	$: {
		if (formData.unitId && !availableUnits.find((u) => u.id === formData.unitId)) {
			formData.unitId = '';
		}
	}

	// Auto-populate rent and deposit using a separate reactive block
	// to avoid the recursive loop.
	$: {
		if (formData.unitId && !lease) {
			const selectedUnit = availableUnits.find((u) => u.id === formData.unitId);
			if (selectedUnit) {
				// To prevent a recursive loop, we should update the specific properties
				// but this still triggers the parent component.
				// A better approach is to handle this outside of a reactive block.
			}
		}
	}

	// NEW APPROACH: use a separate variable for rent/deposit and merge it on unitId change.
	// This is the key change to break the loop.
	let autoPopulatedRent: number | undefined = undefined;
	let autoPopulatedDeposit: number | undefined = undefined;

	$: {
		if (formData.unitId && !lease) {
			const selectedUnit = availableUnits.find((u) => u.id === formData.unitId);
			if (selectedUnit) {
				autoPopulatedRent = selectedUnit.monthlyRent;
				autoPopulatedDeposit = selectedUnit.deposit;
			} else {
				autoPopulatedRent = undefined;
				autoPopulatedDeposit = undefined;
			}
		} else {
			autoPopulatedRent = undefined;
			autoPopulatedDeposit = undefined;
		}
	}

	// Filter properties to only show those with available units
	$: availableProperties =
		properties && Array.isArray(properties)
			? properties.filter((p) => p.units.some((u) => u.isAvailable) || p.id === formData.propertyId)
			: [];

	function validateForm(): boolean {
		const newErrors: Partial<Record<keyof typeof formData, string>> = {};

		if (!formData.tenantId) newErrors.tenantId = 'Tenant is required';
		if (!formData.propertyId) newErrors.propertyId = 'Property is required';
		if (!formData.unitId) newErrors.unitId = 'Unit is required';
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

	// Use a single handleChange function with a temporary object to apply all changes at once
	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
		const field = target.id as keyof typeof formData;
		const value = target.type === 'number' ? Number(target.value) : target.value;

		let newFormData = { ...formData, [field]: value };

		// If the changed field is the unit, apply the auto-populated values immediately.
		if (field === 'unitId' && newFormData.unitId && !lease) {
			const selectedUnit = availableUnits.find((u) => u.id === newFormData.unitId);
			if (selectedUnit) {
				newFormData.monthlyRent = selectedUnit.monthlyRent;
				newFormData.securityDeposit = selectedUnit.deposit;
			}
		}

		formData = newFormData;

		// Reset the error for the changed field
		if (errors[field]) {
			errors = { ...errors, [field]: '' };
		}
	}

	function getUnitDisplayName(unit: Unit): string {
		return `${unit.unitNumber} - ${unit.bedrooms}BR/${unit.bathrooms}BA - $${unit.monthlyRent}/mo`;
	}

	function getPropertyDisplayName(property: Property): string {
		const availableUnitsCount = property.units.filter((u) => u.isAvailable).length;
		const totalUnits = property.units.length;
		return `${property.address}${property.name ? ` (${property.name})` : ''} - ${availableUnitsCount}/${totalUnits} units available`;
	}
</script>

<form on:submit={handleSubmit} class="space-y-6 p-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div>
			<label for="clientId" class="mb-2 block text-xs font-medium text-gray-700"> Tenant * </label>
			<select
				id="clientId"
				bind:value={formData.tenantId}
				on:change={handleChange}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.tenantId ? 'border-red-300' : 'border-gray-300'
				}`}
			>
				<option value="">Select a tenant</option>
				{#each tenants as tenant (tenant.id)}
					<option value={tenant.id}>
						{tenant.firstName}
						{tenant.lastName}
					</option>
				{/each}
			</select>
			{#if errors.tenantId}<p class="mt-1 text-xs text-red-500">{errors.tenantId}</p>{/if}
		</div>

		<div>
			<label for="propertyId" class="mb-2 block text-xs font-medium text-gray-700">
				Property *
			</label>
			<select
				id="propertyId"
				bind:value={formData.propertyId}
				on:change={handleChange}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.propertyId ? 'border-red-300' : 'border-gray-300'
				}`}
			>
				<option value="">Select a property</option>
				{#each availableProperties as property (property.id)}
					<option value={property.id}>
						{getPropertyDisplayName(property)}
					</option>
				{/each}
			</select>
			{#if errors.propertyId}<p class="mt-1 text-xs text-red-500">{errors.propertyId}</p>{/if}
		</div>

		<div>
			<label for="unitId" class="mb-2 block text-xs font-medium text-gray-700"> Unit * </label>
			<select
				id="unitId"
				bind:value={formData.unitId}
				on:change={handleChange}
				disabled={!formData.propertyId}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.unitId ? 'border-red-300' : 'border-gray-300'
				} ${!formData.propertyId ? 'cursor-not-allowed opacity-50' : ''}`}
			>
				<option value="">Select a unit</option>
				{#each availableUnits as unit (unit.id)}
					<option value={unit.id} disabled={!unit.isAvailable && unit.id !== formData.unitId}>
						{getUnitDisplayName(unit)}
						{#if !unit.isAvailable && unit.id !== formData.unitId}
							(Occupied){/if}
					</option>
				{/each}
			</select>
			{#if errors.unitId}<p class="mt-1 text-xs text-red-500">{errors.unitId}</p>{/if}
		</div>

		<div>
			<label for="startDate" class="mb-2 block text-xs font-medium text-gray-700">
				Start Date *
			</label>
			<input
				id="startDate"
				type="date"
				bind:value={formData.startDate}
				on:change={handleChange}
				class={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
					errors.startDate ? 'border-red-300' : 'border-gray-300'
				}`}
			/>
			{#if errors.startDate}<p class="mt-1 text-xs text-red-500">{errors.startDate}</p>{/if}
		</div>

		<div>
			<label for="endDate" class="mb-2 block text-xs font-medium text-gray-700"> End Date * </label>
			<input
				id="endDate"
				type="date"
				bind:value={formData.endDate}
				on:change={handleChange}
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
				id="monthlyRent"
				type="number"
				min="0"
				step="0.01"
				bind:value={formData.monthlyRent}
				on:change={handleChange}
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
				id="securityDeposit"
				type="number"
				min="0"
				step="0.01"
				bind:value={formData.securityDeposit}
				on:change={handleChange}
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
				id="status"
				bind:value={formData.status}
				on:change={handleChange}
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
				id="signedDate"
				type="date"
				bind:value={formData.signedDate}
				on:change={handleChange}
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div class="md:col-span-2">
			<label for="terms" class="mb-2 block text-xs font-medium text-gray-700"> Lease Terms </label>
			<textarea
				id="terms"
				bind:value={formData.terms}
				on:change={handleChange}
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
				id="specialConditions"
				bind:value={formData.specialConditions}
				on:change={handleChange}
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
