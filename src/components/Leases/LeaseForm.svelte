<script lang="ts">
	import { generateId } from '../../utils/helpers';
	import type { LeaseAgreement, Tenant, Property, Unit } from '../../types';

	export let lease: LeaseAgreement | undefined;
	export let tenants: Tenant[];
	export let properties: Property[];
	export let onSave: (lease: LeaseAgreement) => void;
	export let onCancel: () => void;
	export let onCreateTenant: ((tenant: Tenant) => void) | undefined = undefined;

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

	// Tenant creation fields integrated into the main form
	let tenantData = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		dateOfBirth: '',
		emergencyContact: '',
		emergencyPhone: ''
	};

	let errors: Partial<Record<keyof typeof formData, string>> = {};
	let tenantErrors: Partial<Record<keyof typeof tenantData, string>> = {};

	// Track whether we're creating a new tenant or selecting existing
	let isCreatingNewTenant = false;

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
			// If editing existing lease, don't show tenant creation
			isCreatingNewTenant = false;
		}
	}

	// Reactively determine selected property and available units
	$: selectedProperty = properties.find((p) => p.id === formData.propertyId);
	$: availableUnits = selectedProperty?.units || [];

	// Reset unitId if it's no longer valid for the new property
	$: {
		if (formData.unitId && !availableUnits.find((u) => u.id === formData.unitId)) {
			formData.unitId = '';
		}
	}

	// Filter properties to only show those with available units.
	// The conditional logic now checks if we are editing an existing lease.
	$: availableProperties =
		properties && Array.isArray(properties)
			? properties.filter((p) => {
					const hasAvailableUnits = p.units.some((u) => u.isAvailable);
					const isCurrentProperty = lease && p.id === formData.propertyId;
					return hasAvailableUnits || isCurrentProperty;
				})
			: [];

	function validateLeaseForm(): boolean {
		const newErrors: Partial<Record<keyof typeof formData, string>> = {};

		// Only validate tenantId if we're not creating a new tenant
		if (!isCreatingNewTenant && !formData.tenantId) {
			newErrors.tenantId = 'Tenant is required';
		}

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

	function validateTenantForm(): boolean {
		if (!isCreatingNewTenant) return true;

		const newErrors: Partial<Record<keyof typeof tenantData, string>> = {};

		if (!tenantData.firstName.trim()) newErrors.firstName = 'First name is required';
		if (!tenantData.lastName.trim()) newErrors.lastName = 'Last name is required';
		if (!tenantData.email.trim()) newErrors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantData.email)) {
			newErrors.email = 'Please enter a valid email address';
		}
		if (!tenantData.phone.trim()) newErrors.phone = 'Phone number is required';

		// Check if email already exists
		if (tenantData.email && tenants.some((t) => t.email === tenantData.email)) {
			newErrors.email = 'A tenant with this email already exists';
		}

		tenantErrors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		const isLeaseValid = validateLeaseForm();
		const isTenantValid = validateTenantForm();

		if (!isLeaseValid || !isTenantValid) return;

		const now = new Date().toISOString();
		let tenantId = formData.tenantId;

		// Create new tenant if needed
		if (isCreatingNewTenant && onCreateTenant) {
			const newTenant: Tenant = {
				id: generateId(),
				...tenantData,
				address: '',
				createdAt: now,
				updatedAt: now
			};
			onCreateTenant(newTenant);
			tenantId = newTenant.id;
		}

		const leaseData: LeaseAgreement = {
			id: lease?.id || generateId(),
			...formData,
			tenantId,
			createdAt: lease?.createdAt || now,
			updatedAt: now
		};

		onSave(leaseData);
	}

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

	function handleTenantChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const field = target.id as keyof typeof tenantData;
		const value = target.value;

		tenantData = { ...tenantData, [field]: value };

		// Reset the error for the changed field
		if (tenantErrors[field]) {
			tenantErrors = { ...tenantErrors, [field]: '' };
		}
	}

	function handleTenantModeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		isCreatingNewTenant = target.value === 'new';

		// Reset errors when switching modes
		errors = { ...errors, tenantId: '' };
		tenantErrors = {};

		// Reset form data when switching modes
		if (isCreatingNewTenant) {
			formData.tenantId = '';
			tenantData = {
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				dateOfBirth: '',
				emergencyContact: '',
				emergencyPhone: ''
			};
		}
	}

	function getUnitDisplayName(unit: Unit): string {
		return `${unit.unitNumber} - ${unit.bedrooms}BR/${unit.bathrooms}BA - $${unit.monthlyRent}/mo`;
	}

	function getPropertyDisplayName(property: Property): string {
		const availableUnitsCount = property.units.filter((u) => u.isAvailable).length;
		const totalUnits = property.units.length;
		return `${property.address}${property.name ? ` (${property.name})` : 'N/A'} - ${availableUnitsCount}/${totalUnits} units available`;
	}
</script>

<form on:submit={handleSubmit} class="space-y-6 p-6">
	<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
		{#if !lease && onCreateTenant}
			<div class="flex flex-col items-start justify-between sm:flex-row sm:items-center">
				<h3 class="mb-4 text-xl font-semibold text-gray-800 sm:mb-0">Tenant Information</h3>
				<div class="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
					<label class="cursor-pointer">
						<input
							type="radio"
							name="tenantMode"
							value="existing"
							checked={!isCreatingNewTenant}
							on:change={handleTenantModeChange}
							class="peer hidden"
						/>
						<div
							class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm"
						>
							Existing Tenant
						</div>
					</label>
					<label class="cursor-pointer">
						<input
							type="radio"
							name="tenantMode"
							value="new"
							checked={isCreatingNewTenant}
							on:change={handleTenantModeChange}
							class="peer hidden"
						/>
						<div
							class="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors peer-checked:bg-white peer-checked:text-blue-600 peer-checked:shadow-sm"
						>
							New Tenant
						</div>
					</label>
				</div>
			</div>
		{/if}

		<div class="mt-6">
			{#if !isCreatingNewTenant}
				<div>
					<label for="tenantId" class="mb-2 block text-sm font-medium text-gray-700"
						>Select Tenant <span class="text-red-500">*</span></label
					>
					<select
						id="tenantId"
						bind:value={formData.tenantId}
						on:change={handleChange}
						class={`w-full rounded-lg border px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
							errors.tenantId ? 'border-red-500' : 'border-gray-300'
						}`}
					>
						<option value="" disabled selected>Select a tenant</option>
						{#each tenants as tenant (tenant.id)}
							<option value={tenant.id}>
								{tenant.firstName}
								{tenant.lastName} - {tenant.email}
							</option>
						{/each}
					</select>
					{#if errors.tenantId}<p class="mt-2 text-xs text-red-500">{errors.tenantId}</p>{/if}
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="firstName" class="mb-2 block text-sm font-medium text-gray-700"
							>First Name <span class="text-red-500">*</span></label
						>
						<input
							id="firstName"
							type="text"
							bind:value={tenantData.firstName}
							on:input={handleTenantChange}
							class={`w-full rounded-lg border px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
								tenantErrors.firstName ? 'border-red-500' : 'border-gray-300'
							}`}
						/>
						{#if tenantErrors.firstName}<p class="mt-2 text-xs text-red-500">
								{tenantErrors.firstName}
							</p>{/if}
					</div>

					<div>
						<label for="lastName" class="mb-2 block text-sm font-medium text-gray-700"
							>Last Name <span class="text-red-500">*</span></label
						>
						<input
							id="lastName"
							type="text"
							bind:value={tenantData.lastName}
							on:input={handleTenantChange}
							class={`w-full rounded-lg border px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
								tenantErrors.lastName ? 'border-red-500' : 'border-gray-300'
							}`}
						/>
						{#if tenantErrors.lastName}<p class="mt-2 text-xs text-red-500">
								{tenantErrors.lastName}
							</p>{/if}
					</div>

					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700"
							>Email <span class="text-red-500">*</span></label
						>
						<input
							id="email"
							type="email"
							bind:value={tenantData.email}
							on:input={handleTenantChange}
							class={`w-full rounded-lg border px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
								tenantErrors.email ? 'border-red-500' : 'border-gray-300'
							}`}
						/>
						{#if tenantErrors.email}<p class="mt-2 text-xs text-red-500">
								{tenantErrors.email}
							</p>{/if}
					</div>

					<div>
						<label for="phone" class="mb-2 block text-sm font-medium text-gray-700"
							>Phone <span class="text-red-500">*</span></label
						>
						<input
							id="phone"
							type="tel"
							bind:value={tenantData.phone}
							on:input={handleTenantChange}
							class={`w-full rounded-lg border px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
								tenantErrors.phone ? 'border-red-500' : 'border-gray-300'
							}`}
						/>
						{#if tenantErrors.phone}<p class="mt-2 text-xs text-red-500">
								{tenantErrors.phone}
							</p>{/if}
					</div>

					<div>
						<label for="dateOfBirth" class="mb-2 block text-sm font-medium text-gray-700"
							>Date of Birth</label
						>
						<input
							id="dateOfBirth"
							type="date"
							bind:value={tenantData.dateOfBirth}
							on:input={handleTenantChange}
							class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="emergencyContact" class="mb-2 block text-sm font-medium text-gray-700"
							>Emergency Contact</label
						>
						<input
							id="emergencyContact"
							type="text"
							bind:value={tenantData.emergencyContact}
							on:input={handleTenantChange}
							class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div class="md:col-span-2">
						<label for="emergencyPhone" class="mb-2 block text-sm font-medium text-gray-700"
							>Emergency Phone</label
						>
						<input
							id="emergencyPhone"
							type="tel"
							bind:value={tenantData.emergencyPhone}
							on:input={handleTenantChange}
							class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-700 transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Lease Information Section -->
	<div class="rounded-lg border border-gray-200 bg-white p-4">
		<h3 class="mb-4 text-lg font-medium text-gray-900">Lease Details</h3>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div>
				<label for="propertyId" class="mb-2 block text-xs font-medium text-gray-700"
					>Property *</label
				>
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
				<label for="unitId" class="mb-2 block text-xs font-medium text-gray-700">Unit *</label>
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
							{#if !unit.isAvailable && unit.id !== formData.unitId}(Occupied){/if}
						</option>
					{/each}
				</select>
				{#if errors.unitId}<p class="mt-1 text-xs text-red-500">{errors.unitId}</p>{/if}
			</div>

			<div>
				<label for="startDate" class="mb-2 block text-xs font-medium text-gray-700"
					>Start Date *</label
				>
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
				<label for="endDate" class="mb-2 block text-xs font-medium text-gray-700">End Date *</label>
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
				<label for="monthlyRent" class="mb-2 block text-xs font-medium text-gray-700"
					>Monthly Rent *</label
				>
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
				<label for="securityDeposit" class="mb-2 block text-xs font-medium text-gray-700"
					>Security Deposit *</label
				>
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
				<label for="status" class="mb-2 block text-xs font-medium text-gray-700">Status *</label>
				<select
					id="status"
					bind:value={formData.status}
					on:change={handleChange}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
				>
					{#each LEASE_STATUSES as status (status.value)}
						<option value={status.value}>{status.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="signedDate" class="mb-2 block text-xs font-medium text-gray-700"
					>Signed Date</label
				>
				<input
					id="signedDate"
					type="date"
					bind:value={formData.signedDate}
					on:change={handleChange}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="md:col-span-2">
				<label for="terms" class="mb-2 block text-xs font-medium text-gray-700">Lease Terms</label>
				<textarea
					id="terms"
					bind:value={formData.terms}
					on:change={handleChange}
					rows={4}
					placeholder="Standard lease terms and conditions..."
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>

			<div class="md:col-span-2">
				<label for="specialConditions" class="mb-2 block text-xs font-medium text-gray-700"
					>Special Conditions</label
				>
				<textarea
					id="specialConditions"
					bind:value={formData.specialConditions}
					on:change={handleChange}
					rows={3}
					placeholder="Any special conditions or requirements..."
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>
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
			{lease ? 'Update Lease' : 'Create Lease Agreement'}
		</button>
	</div>
</form>
