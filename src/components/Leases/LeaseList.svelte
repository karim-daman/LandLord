<script lang="ts">
	import SearchFilter from '../Common/SearchFilter.svelte';
	import Modal from '../Common/Modal.svelte';
	import LeaseForm from './LeaseForm.svelte';
	import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
	import type { LeaseAgreement, Client, Property } from '../../types';
	import {
		calendarClock,
		calendar2,
		edit,
		eye,
		home2,
		plus,
		trash,
		user,
		fadingClock,
		table,
		grid
	} from '../Icons/icons';

	let showJsonModal = false;

	export let leases: LeaseAgreement[];
	export let clients: Client[];
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

	let viewMode: 'card' | 'table' = 'card'; // New view mode state

	const filterOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'expired', label: 'Expired' },
		{ value: 'terminated', label: 'Terminated' }
	];

	// Reactive declarations to find the client and property for the selected lease
	$: selectedClient = selectedLease
		? clients.find((c) => c.id === selectedLease?.clientId)
		: undefined;
	$: selectedProperty = selectedLease
		? properties.find((p) => p.id === selectedLease?.propertyId)
		: undefined;

	// Added a check to ensure `leases` is an array before calling `.filter()`
	$: {
		filteredLeases = (Array.isArray(leases) ? leases : []).filter((lease) => {
			const client = clients.find((c) => c.id === lease.clientId);
			const property = properties.find((p) => p.id === lease.propertyId);

			const matchesSearch =
				(client &&
					`${client.firstName} ${client.lastName}`
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
	function isExpiringSoon(endDate: string, lease: any): boolean {
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

	// Helper function to get client name
	function getClientName(clientId: string): string {
		const client = clients.find((c) => c.id === clientId);
		return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
	}

	// Helper function to get property address
	function getPropertyAddress(propertyId: string): string {
		const property = properties.find((p) => p.id === propertyId);
		return property ? property.address : 'Unknown Property';
	}

	function getProgressColor(progress: number, isExpired: boolean): string {
		if (isExpired) return 'bg-red-500';
		if (progress <= 50) return 'bg-green-600';
		if (progress <= 75) return 'bg-green-600';
		return 'bg-blue-600';
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
		onSearchChange={(term) => (searchTerm = term)}
		{filterOptions}
		{filterValue}
		onFilterChange={(value) => (filterValue = value)}
		placeholder="Search leases by client name or property address..."
	/>

	<div class="mb-1 flex justify-end">
		<div class="flex rounded-lg border border-gray-300 bg-white p-1">
			<button
				on:click={() => (viewMode = 'card')}
				class={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
					viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
				}`}
			>
				{@html grid}
			</button>
			<button
				on:click={() => (viewMode = 'table')}
				class={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
					viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
				}`}
			>
				{@html table}
			</button>
		</div>
	</div>

	<Modal
		isOpen={showJsonModal}
		onClose={() => (showJsonModal = false)}
		title="Leases Data (JSON)"
		maxWidth="max-w-4xl"
	>
		<div class="max-h-[70vh] overflow-auto p-6">
			<pre class="rounded-lg bg-gray-100 p-4 text-xs text-gray-800">{JSON.stringify(
					leases,
					null,
					2
				)}</pre>
		</div>
		<div class="flex justify-end border-t p-4">
			<button
				on:click={() => (showJsonModal = false)}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				Close
			</button>
		</div>
	</Modal>

	<div class="mb-6 flex items-center justify-between">
		<div></div>
		<div class="flex items-center space-x-3">
			<button
				on:click={() => (showJsonModal = true)}
				class="flex w-[150px] items-center space-x-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
			>
				code
				<span>View JSON</span>
			</button>
			<button
				on:click={handleCreate}
				class="flex w-[150px] items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				{@html plus}
				<span>Create Lease</span>
			</button>
		</div>
	</div>

	{#if viewMode === 'card'}
		<!-- Card View -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each filteredLeases as lease (lease.id)}
				<div
					class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
				>
					<div class="p-6">
						<div class="mb-4 flex items-start justify-between">
							<div class="flex items-center space-x-2">
								<span
									class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(
										getDisplayStatus(lease)
									)}`}
								>
									{getDisplayStatus(lease).charAt(0).toUpperCase() +
										getDisplayStatus(lease).slice(1)}
								</span>
								<!-- Show "Expiring Soon" badge only for active leases that are expiring within 30 days -->
								{#if getDisplayStatus(lease) === 'active' && isExpiringSoon(lease.endDate, lease)}
									<span
										class="rounded-full border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800"
									>
										Expiring Soon
									</span>
								{/if}
							</div>
							<div class="flex space-x-2">
								<button
									on:click={() => handleView(lease)}
									class="p-1 text-gray-400 transition-colors hover:text-green-600"
									title="View Details"
								>
									{@html eye}
								</button>
								<button
									on:click={() => handleEdit(lease)}
									class="p-1 text-gray-400 transition-colors hover:text-green-600"
									title="Edit Lease"
								>
									{@html edit}
								</button>
								<button
									on:click={() => handleDelete(lease)}
									class="p-1 text-gray-400 transition-colors hover:text-red-600"
									title="Delete Lease"
								>
									{@html trash}
								</button>
							</div>
						</div>

						<div class="space-y-3">
							<div class="flex items-center text-xs text-gray-900">
								{@html user}
								<span class="font-medium">
									{getClientName(lease.clientId)}
								</span>
							</div>

							<div class="flex items-start text-xs text-gray-600">
								{@html home2}
								<span class="line-clamp-2">
									{getPropertyAddress(lease.propertyId)}
								</span>
							</div>

							<div class="mr-1 flex justify-between">
								<div class="flex items-center text-xs text-gray-600">
									{@html calendar2}
									<span>
										{formatDate(lease.startDate)} - {formatDate(lease.endDate)}
									</span>
								</div>

								<div class="flex items-center text-xs text-gray-600">
									{@html calendarClock}
									<span class:text-red-600={getDisplayStatus(lease) === 'expired'}>
										Duration: {calculateLeaseDuration(lease.startDate, lease.endDate)}
									</span>
								</div>
							</div>

							<!-- The target div has been modified here -->
							<div
								id="target"
								class="flex items-center justify-between gap-4 rounded-sm border border-gray-100 p-1 px-2 {getDisplayStatus(
									lease
								) === 'expired'
									? 'bg-red-100'
									: 'bg-green-100'} "
							>
								<!-- Left side: Remaining time -->

								<div class="flex items-center border-gray-300 text-xs text-black">
									{@html fadingClock}
									<span
										class={remainingDuration(lease.endDate) === 'Expired'
											? 'text-red-600'
											: 'text-gray-600'}
									>
										{remainingDuration(lease.endDate)}
									</span>
								</div>

								<!-- Right side: Progress bar -->
								<div class="max-w-[50%] flex-1">
									<div class="flex items-center justify-between">
										<p class="text-xs text-black">Lease Progress</p>
										<span class="text-xs font-semibold text-gray-900">
											{calculateLeaseProgress(lease.startDate, lease.endDate)}%
										</span>
									</div>

									<div class="h-2 w-full rounded-full bg-gray-200">
										<div
											class="h-full rounded-full transition-all duration-300 ease-in-out {getProgressColor(
												calculateLeaseProgress(lease.startDate, lease.endDate),
												getDisplayStatus(lease) === 'expired'
											)}"
											style="width: {calculateLeaseProgress(lease.startDate, lease.endDate)}%"
										></div>
									</div>
								</div>
							</div>

							<div class="flex items-center justify-between border-t border-gray-100 pt-3">
								<div>
									<p class="text-xs text-gray-600">Monthly Rent</p>
									<p class="font-semibold text-gray-900">{formatCurrency(lease.monthlyRent)}</p>
								</div>
								<div class="text-right">
									<p class="text-xs text-gray-600">Deposit</p>
									<p class="font-semibold text-gray-900">{formatCurrency(lease.securityDeposit)}</p>
								</div>
							</div>
						</div>
					</div>

					<div class="border-t border-gray-100 bg-gray-50 px-6 py-3">
						<p class="text-xs text-gray-500">
							Created {formatDate(lease.createdAt)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Table View -->
		<div class="ring-opacity-5 overflow-scroll bg-white shadow ring-1 ring-black md:rounded-lg">
			<table class="min-w-full divide-y divide-gray-300">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Status
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Client
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Property
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Period
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Duration
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Remaining
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Progress
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Monthly Rent
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
						>
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each filteredLeases as lease (lease.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center space-x-2">
									<span
										class={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(
											getDisplayStatus(lease)
										)}`}
									>
										{getDisplayStatus(lease).charAt(0).toUpperCase() +
											getDisplayStatus(lease).slice(1)}
									</span>
									{#if getDisplayStatus(lease) === 'active' && isExpiringSoon(lease.endDate, lease)}
										<span
											class="rounded-full border border-orange-200 bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800"
										>
											Soon
										</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-xs font-medium text-gray-900">
									{getClientName(lease.clientId)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="max-w-xs truncate text-xs text-gray-900">
									{getPropertyAddress(lease.propertyId)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div
									class="text-xs text-gray-900"
									class:text-red-600={getDisplayStatus(lease) === 'expired'}
								>
									{calculateLeaseDuration(lease.startDate, lease.endDate)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div
									class="text-xs text-gray-900"
									class:text-red-600={getDisplayStatus(lease) === 'expired'}
								>
									{remainingDuration(lease.endDate)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="mr-2 h-2 w-16 rounded-full bg-gray-200">
										<div
											class="h-2 rounded-full {getProgressColor(
												calculateLeaseProgress(lease.startDate, lease.endDate),
												getDisplayStatus(lease) === 'expired'
											)}"
											style="width: {calculateLeaseProgress(lease.startDate, lease.endDate)}%"
										></div>
									</div>

									<span class="text-xs text-gray-900">
										{calculateLeaseProgress(lease.startDate, lease.endDate)}%
									</span>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-xs font-medium text-gray-900">
									{formatCurrency(lease.monthlyRent)}
								</div>
								<div class="text-xs text-gray-500">
									Deposit: {formatCurrency(lease.securityDeposit)}
								</div>
							</td>
							<td class="px-6 py-4 text-right text-xs font-medium whitespace-nowrap">
								<div class="flex space-x-2">
									<button
										on:click={() => handleView(lease)}
										class="p-1 text-gray-400 transition-colors hover:text-green-600"
										title="View Details"
									>
										{@html eye}
									</button>
									<button
										on:click={() => handleEdit(lease)}
										class="p-1 text-gray-400 transition-colors hover:text-green-600"
										title="Edit Lease"
									>
										{@html edit}
									</button>
									<button
										on:click={() => handleDelete(lease)}
										class="p-1 text-gray-400 transition-colors hover:text-red-600"
										title="Delete Lease"
									>
										{@html trash}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if filteredLeases.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">No lease agreements found matching your search criteria.</p>
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	<Modal
		isOpen={showForm}
		onClose={() => {
			showForm = false;
			selectedLease = undefined;
		}}
		title={selectedLease ? 'Edit Lease Agreement' : 'Create New Lease Agreement'}
		maxWidth="max-w-4xl"
	>
		<LeaseForm
			lease={selectedLease}
			{clients}
			{properties}
			onSave={handleSave}
			onCancel={() => {
				showForm = false;
				selectedLease = undefined;
			}}
		/>
	</Modal>

	<!-- Details Modal -->
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
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<label for="lastName" class="mb-1 block text-xs font-medium text-gray-700">Client</label
						>
						<p class="text-xs text-gray-900">
							{selectedClient
								? `${selectedClient.firstName} ${selectedClient.lastName}`
								: 'Unknown Client'}
						</p>
						{#if selectedClient}
							<p class="mt-1 text-xs text-gray-600">{selectedClient.email}</p>
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

	<!-- Delete Confirmation Modal -->
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
