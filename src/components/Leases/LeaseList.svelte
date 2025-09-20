<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import { tenants } from '$lib/stores';
	import Modal from '../Common/Modal.svelte';
	import LeaseForm from './LeaseForm.svelte';
	import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
	import type { LeaseAgreement, Tenant, Property } from '../../types';
	import HoverModal from '../Common/HoverModal.svelte';
	import { calendarClock, calendar2, edit, eye, home2, plus, trash, user } from '../Icons/icons';
	import toast from 'svelte-5-french-toast';

	export let leases: LeaseAgreement[];
	export let tenantOptions: Tenant[];
	export let properties: Property[];
	export let onCreateLease: (lease: LeaseAgreement) => void;
	export let onUpdateLease: (lease: LeaseAgreement) => void;
	export let onDeleteLease: (id: string) => void;

	let searchTerm = '';
	let filterValue = '';
	let showForm = false;
	let showDetails = false;
	let selectedLease: LeaseAgreement | undefined;
	let showDeleteConfirm = false;

	const filterOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'terminated', label: 'Terminated' }
	];

	// Reactive declarations to find the tenant and property for the selected lease
	$: selectedTenant = selectedLease
		? tenantOptions.find((c) => c.id === selectedLease?.tenantId)
		: undefined;
	$: selectedProperty = selectedLease
		? properties.find((p) => p.id === selectedLease?.propertyId)
		: undefined;

	// Use reactive statement to find the filtered leases
	// This will automatically re-run whenever leases, tenants, properties, or searchTerm/filterValue changes
	$: {
		// Ensure leases, tenants, and properties are valid arrays before filtering
		const validLeases = Array.isArray(leases) ? leases : [];
		const validTenants = Array.isArray(tenantOptions) ? tenantOptions : [];
		const validProperties = Array.isArray(properties) ? properties : [];

		filteredLeases = validLeases.filter((lease) => {
			const tenant = validTenants.find((c) => c.id === lease.tenantId);
			const property = validProperties.find((p) => p.id === lease.propertyId);

			const matchesSearch =
				(tenant &&
					`${tenant.firstName} ${tenant.lastName}`
						.toLowerCase()
						.includes(searchTerm.toLowerCase())) ||
				(property && property.address.toLowerCase().includes(searchTerm.toLowerCase()));

			const matchesFilter = !filterValue || lease.status === filterValue;
			return matchesSearch && matchesFilter;
		});
	}

	let filteredLeases: LeaseAgreement[];

	// New function to calculate lease progress
	function calculateLeaseProgress(startDate: string, endDate: string): number {
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime();
		const now = Date.now();

		// Handle cases where start or end dates are invalid or identical
		if (isNaN(start) || isNaN(end) || start >= end) {
			return 0;
		}

		// If the lease hasn't started, progress is 0
		if (now < start) return 0;

		// If the lease is over, progress is 100%
		if (now > end) return 100;

		const totalDuration = end - start;
		const elapsedDuration = now - start;
		const progress = (elapsedDuration / totalDuration) * 100;

		return Math.round(progress);
	}

	/**
	 * Calculates the duration between two dates and returns a formatted string.
	 * @param startDate The start date of the lease as a string.
	 * @param endDate The end date of the lease as a string.
	 * @returns A string formatted as "years : xx , months : xx , days: xx".
	 */
	function calculateLeaseDuration(startDate: string, endDate: string): string {
		const start = new Date(startDate);
		const end = new Date(endDate);

		let years = end.getFullYear() - start.getFullYear();
		let months = end.getMonth() - start.getMonth();
		let days = end.getDate() - start.getDate();

		// If days are negative, borrow a month
		if (days < 0) {
			months--;
			const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
			days += lastMonth.getDate();
		}

		// If months are negative, borrow a year
		if (months < 0) {
			years--;
			months += 12;
		}

		return `${years}y ${months}m ${days}d`;
	}

	/**
	 * Fixed function to check if a lease is expiring within 30 days
	 * @param endDate The lease's end date (ISO format or Date-parsable string)
	 * @returns true if the lease expires within 1-30 days from today
	 */
	function isExpiringSoon(endDate: string, lease: LeaseAgreement): boolean {
		console.log(lease);

		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time to start of day

		const expiry = new Date(endDate);
		if (isNaN(expiry.getTime())) return false;
		expiry.setHours(0, 0, 0, 0); // Reset time to start of day

		// Calculate the difference in milliseconds
		const timeDiff = expiry.getTime() - today.getTime();

		// Convert to days
		const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

		console.log(`Checking lease expiry: ${endDate}`);
		console.log(`Today: ${today.toDateString()}`);
		console.log(`Expiry: ${expiry.toDateString()}`);
		console.log(`Days difference: ${daysDiff}`);

		// Return true if lease expires within 1-30 days (inclusive)
		// This means the lease is still active but will expire soon
		return daysDiff >= 1 && daysDiff <= 30;
	}

	/**
	 * Calculates the remaining duration of a lease from the current date to the end date.
	 * @param endDate The lease's end date as a string.
	 * @returns A string formatted as "X years, Y months, Z days remaining", or "Expired" if the lease is over.
	 */
	function remainingDuration(endDate: string): string {
		const start = new Date();
		const end = new Date(endDate);

		// If the end date is invalid, return a default string
		if (isNaN(end.getTime())) {
			return 'Invalid Date';
		}

		// If the lease has already expired, return a specific message
		if (end.getTime() < start.getTime()) {
			return 'Expired';
		}

		// Calculate the difference in years, months, and days
		let years = end.getFullYear() - start.getFullYear();
		let months = end.getMonth() - start.getMonth();
		let days = end.getDate() - start.getDate();

		// Adjust for negative days
		if (days < 0) {
			months--;
			const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
			days += lastMonth.getDate();
		}

		// Adjust for negative months
		if (months < 0) {
			years--;
			months += 12;
		}

		// Build the parts of the duration string
		const parts = [];
		if (years > 0) parts.push(`${years}y`);
		if (months > 0) parts.push(`${months}m`);
		if (days > 0) parts.push(`${days}d`);

		// If no parts are available (e.g., less than a day remaining), show days
		if (parts.length === 0) {
			const timeDiff = end.getTime() - start.getTime();
			const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
			return daysRemaining > 0 ? `${daysRemaining}d remaining` : 'Expired';
		}

		return parts.join(' ') + ' remaining';
	}

	/**
	 * Dynamically determines the display status of a lease without modifying the original object.
	 * @param lease The lease object.
	 * @returns The appropriate status string ('expired' or the original status).
	 */
	function getDisplayStatus(lease: LeaseAgreement): string {
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		const endDate = new Date(lease.endDate);
		endDate.setHours(0, 0, 0, 0);

		// If the lease end date has passed, return 'expired' regardless of original status

		if (endDate.getTime() < now.getTime()) {
			return 'expired';
		}

		// Otherwise, return the original status
		return lease.status;
	}

	function handleCreate() {
		selectedLease = undefined;
		showForm = true;
	}

	function handleEdit(lease: LeaseAgreement) {
		selectedLease = lease;
		showForm = true;
	}

	function handleView(lease: LeaseAgreement) {
		selectedLease = lease;
		showDetails = true;
	}

	function handleDelete(lease: LeaseAgreement) {
		selectedLease = lease;
		showDeleteConfirm = true;
	}

	function handleSave(lease: LeaseAgreement) {
		if (selectedLease) {
			onUpdateLease(lease);
		} else {
			onCreateLease(lease);
		}
		showForm = false;
		selectedLease = undefined;
	}

	function confirmDelete() {
		if (selectedLease) {
			onDeleteLease(selectedLease.id);
		}
		showDeleteConfirm = false;
		selectedLease = undefined;
	}

	// Helper function to get tenant name
	function getTenantName(tenantId: string): string {
		// Ensure `tenants` is a valid array before attempting to find an element.
		if (!Array.isArray(tenantOptions)) {
			console.error('`tenants` prop is not an array.');
			return 'Unknown Tenant';
		}

		const tenant = tenantOptions.find((c) => c.id === tenantId);
		return tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown Tenant';
	}

	// Helper function to get property address
	function getPropertyAddress(propertyId: string): string {
		const property = properties.find((p) => p.id === propertyId);
		return property ? property.address : 'Unknown Property';
	}

	function getProgressColor(progress: number, isExpired: boolean): string {
		// if (isExpired) return 'bg-red-500';
		if (progress <= 50) return 'bg-green-600';
		if (progress <= 75) return 'bg-green-600';
		return 'bg-red-600';
	}

	function handleCancelLease() {
		showForm = false;
		selectedLease = undefined;
	}

	function handleCreateTenant(tenant: Tenant) {
		tenants.update((prev) => [...prev, tenant]);

		toast.success('Created Tenant', {
			position: 'bottom-right'
		});
	}
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Lease Agreements</h2>

		<div class="flex items-center space-x-3">
			<button
				on:click={handleCreate}
				class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				{@html plus}
				<span>Create Lease</span>
			</button>
		</div>
	</div>

	<SearchFilter
		{searchTerm}
		onSearchChange={(term: string) => (searchTerm = term)}
		{filterOptions}
		{filterValue}
		onFilterChange={(value: string) => (filterValue = value)}
		placeholder="Search leases by tenants name or property address..."
	/>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
		{#each filteredLeases as lease (lease.id)}
			<div
				class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="p-6">
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-center space-x-2">
							<span
								class={`rounded-full  border  px-2 py-1 text-xs font-medium ${getStatusColor(
									getDisplayStatus(lease)
								)} `}
							>
								{getDisplayStatus(lease).charAt(0).toUpperCase() + getDisplayStatus(lease).slice(1)}
							</span>
							{#if getDisplayStatus(lease) === 'active' && isExpiringSoon(lease.endDate, lease)}
								<span
									class="rounded-full border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800"
								>
									Expiring Soon
								</span>
							{/if}
						</div>
						<div class="flex space-x-2 border-gray-300">
							<button
								on:click={() => handleView(lease)}
								class="rounded-md border p-1 px-1 text-gray-400 transition-colors hover:text-green-600"
								title="View Details"
							>
								{@html eye}
							</button>
							<button
								on:click={() => handleEdit(lease)}
								class="rounded-md border p-1 px-1 text-gray-400 transition-colors hover:text-green-600"
								title="Edit Lease"
							>
								{@html edit}
							</button>
							<button
								on:click={() => handleDelete(lease)}
								class="rounded-md border p-1 px-1 text-gray-400 transition-colors hover:text-red-600"
								title="Delete Lease"
							>
								{@html trash}
							</button>
						</div>
					</div>

					<div class="space-y-3">
						<div class=" text-xs">
							<div class="mb-2 flex items-center text-gray-900">
								{@html user}
								<span class="">
									Tenant: {getTenantName(lease.tenantId)}
								</span>
							</div>

							<div class="mb-2 flex items-center text-gray-600">
								{@html home2}
								<span class=" line-clamp-2">
									Address:
									{getPropertyAddress(lease.propertyId)}
								</span>
							</div>

							<div class="flex justify-between text-gray-600">
								<span class="flex">
									{@html calendar2}
									from: {formatDate(lease.startDate)}
									to: {formatDate(lease.endDate)}
								</span>

								<span class="w-[30%]">
									<div class="flex items-center justify-between">
										<span class="text-xs font-semibold text-gray-900">
											{calculateLeaseProgress(lease.startDate, lease.endDate)}%
										</span>
									</div>

									<div class="h-2 rounded-full bg-gray-200">
										<div
											class="h-full rounded-full transition-all duration-300 ease-in-out {getProgressColor(
												calculateLeaseProgress(lease.startDate, lease.endDate),
												getDisplayStatus(lease) === 'expired'
											)}"
											style="width: {calculateLeaseProgress(lease.startDate, lease.endDate)}%"
										></div>
									</div>
								</span>
							</div>

							<div class=" flex justify-between text-gray-600">
								<span class="flex" class:text-red-600={getDisplayStatus(lease) === 'Expired'}>
									{@html calendarClock}
									Duration: {calculateLeaseDuration(lease.startDate, lease.endDate)}
								</span>

								<span class="w-[30%]" class:text-red-600={getDisplayStatus(lease) === 'Expired'}>
									<div class="flex items-center border-gray-300 text-xs text-black">
										<span
											class={remainingDuration(lease.endDate) === 'Expired'
												? 'text-red-600'
												: 'text-gray-600'}
										>
											{remainingDuration(lease.endDate)}
										</span>
									</div>
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-between border-t border-gray-100 p-4 pt-3">
					<HoverModal
						width={400}
						height={190}
						on:show={() => console.log('Modal shown')}
						on:hide={() => console.log('Modal hidden')}
					>
						<div slot="target">
							<p class="text-xs text-gray-600">Monthly Rent</p>
							<p class="font-semibold text-gray-900">{formatCurrency(lease.monthlyRent)}</p>
						</div>

						<div slot="content">
							<h3 class="mb-4 text-lg font-semibold text-gray-900">Lease Details</h3>

							<div class="flex justify-between space-y-4">
								<div>
									<p class="text-sm font-medium text-gray-700">Monthly Rent</p>
									<p class="text-lg font-semibold text-gray-900">
										{formatCurrency(lease.monthlyRent)}
									</p>
								</div>

								<div>
									<p class="text-sm font-medium text-gray-700">Security Deposit</p>
									<p class="text-lg font-semibold text-gray-900">
										{formatCurrency(lease.securityDeposit)}
									</p>
								</div>
							</div>

							<div>
								<p class="text-sm font-medium text-gray-700">Lease Term</p>
								<p class="text-sm text-gray-900">{lease.startDate} - {lease.endDate}</p>
							</div>
						</div>
					</HoverModal>

					<div class="text-right">
						<p class="text-xs text-gray-600">Deposit</p>
						<p class="font-semibold text-gray-900">{formatCurrency(lease.securityDeposit)}</p>
					</div>
				</div>

				<div class="m-1 border-t border-gray-300 bg-gray-50 p-1 px-2">
					<p class="text-xs text-gray-500">
						Created {formatDate(lease.createdAt)}
					</p>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredLeases.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No lease agreements found matching your search criteria.</p>
		</div>
	{/if}

	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedLease = undefined;
		}}
		title={selectedLease ? 'Edit Lease Agreement' : 'Create New Lease Agreement'}
		maxWidth="max-w-4xl"
	>
		<!-- <LeaseForm
			lease={selectedLease}
			{tenants}
			{properties}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedLease = undefined;
			}}
		/>
		 -->

		<LeaseForm
			lease={selectedLease}
			tenants={tenantOptions}
			{properties}
			onSave={handleSave}
			onCancel={handleCancelLease}
			onCreateTenant={handleCreateTenant}
		/>
	</Modal>

	<Modal
		isOpen={showDetails}
		onClose={() => {
			showDetails = false;
			selectedLease = undefined;
		}}
		title="Lease Agreement Details"
		maxWidth="max-w-3xl"
	>
		{#if selectedLease}
			<div class="space-y-6 p-6">
				leaseID: {selectedLease.id}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="lastName" class="mb-1 block text-xs font-medium text-gray-700">Tenant</label
						>
						<p class="text-xs text-gray-900">
							{selectedTenant
								? `${selectedTenant.firstName} ${selectedTenant.lastName}`
								: 'Unknown Tenant'}
						</p>
						{#if selectedTenant}
							<p class="mt-1 text-xs text-gray-600">{selectedTenant.email}</p>
						{/if}
					</div>
					<div>
						<label for="Property" class="mb-1 block text-xs font-medium text-gray-700"
							>Property</label
						>
						<p class="text-xs text-gray-900">
							{selectedProperty ? selectedProperty.address : 'Unknown Property'}
						</p>
					</div>
					<div>
						<label for="startDate" class="mb-1 block text-xs font-medium text-gray-700"
							>Start Date</label
						>
						<p class="text-xs text-gray-900">{formatDate(selectedLease.startDate)}</p>
					</div>
					<div>
						<label for="endDate" class="mb-1 block text-xs font-medium text-gray-700"
							>End Date</label
						>
						<p class="text-xs text-gray-900">{formatDate(selectedLease.endDate)}</p>
					</div>
					<div>
						<label for="monthlyRent" class="mb-1 block text-xs font-medium text-gray-700"
							>Monthly Rent</label
						>
						<p class="text-xs text-gray-900">{formatCurrency(selectedLease.monthlyRent)}</p>
					</div>
					<div>
						<label for="securityDeposit" class="mb-1 block text-xs font-medium text-gray-700"
							>Security Deposit</label
						>
						<p class="text-xs text-gray-900">{formatCurrency(selectedLease.securityDeposit)}</p>
					</div>
					<div>
						<label for="Status" class="mb-1 block text-xs font-medium text-gray-700">Status</label>
						<span
							class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(
								getDisplayStatus(selectedLease)
							)}`}
						>
							{getDisplayStatus(selectedLease).charAt(0).toUpperCase() +
								getDisplayStatus(selectedLease).slice(1)}
						</span>
					</div>
					<div>
						<label for="signedDate" class="mb-1 block text-xs font-medium text-gray-700"
							>Signed Date</label
						>
						<p class="text-xs text-gray-900">
							{selectedLease.signedDate ? formatDate(selectedLease.signedDate) : 'Not signed'}
						</p>
					</div>

					{#if selectedLease.terms}
						<div class="md:col-span-2">
							<label for="terms" class="mb-1 block text-xs font-medium text-gray-700"
								>Lease Terms</label
							>
							<div class="rounded-lg bg-gray-50 p-3 text-xs text-gray-900">
								{selectedLease.terms}
							</div>
						</div>
					{/if}

					{#if selectedLease.specialConditions}
						<div class="md:col-span-2">
							<label for="specialConditions" class="mb-1 block text-xs font-medium text-gray-700"
								>Special Conditions</label
							>
							<div class="rounded-lg bg-gray-50 p-3 text-xs text-gray-900">
								{selectedLease.specialConditions}
							</div>
						</div>
					{/if}
				</div>

				<div class="border-t pt-4">
					<div class="flex justify-between text-xs text-gray-500">
						<span>Created: {new Date(selectedLease.createdAt).toLocaleString()}</span>
						<span>Updated: {new Date(selectedLease.updatedAt).toLocaleString()}</span>
					</div>
				</div>
			</div>
		{/if}
	</Modal>

	<Modal
		isOpen={showDeleteConfirm}
		onClose={() => {
			showDeleteConfirm = false;
			selectedLease = undefined;
		}}
		title="Confirm Deletion"
		maxWidth="max-w-md"
	>
		<div class="p-6">
			<p class="mb-6 text-gray-700">
				Are you sure you want to delete this lease agreement? This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => {
						showDeleteConfirm = false;
						selectedLease = undefined;
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

<style>
	.glass-morphism {
		backdrop-filter: blur(16px) saturate(180%);
		background-color: rgba(255, 255, 255, 0.75);
		border: 1px solid rgba(255, 255, 255, 0.125);
	}

	.gradient-border {
		background:
			linear-gradient(white, white) padding-box,
			linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
		border: 2px solid transparent;
	}

	.hover-lift {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.hover-lift:hover {
		transform: translateY(-8px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
	}

	.status-glow {
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
	}

	.expiring-glow {
		box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
	}

	.modal-backdrop {
		backdrop-filter: blur(8px);
		background-color: rgba(0, 0, 0, 0.3);
	}
</style>
