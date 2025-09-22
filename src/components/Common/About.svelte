<!-- <script lang="ts">
	import { getVersion } from '@tauri-apps/api/app';
	import { check } from '@tauri-apps/plugin-updater';
	import { checkForUpdates } from '../../lib/updateManager';
	import { relaunch } from '@tauri-apps/plugin-process';
	import { onMount } from 'svelte';
	import { arrowRight, downloadUpdate } from '../Icons/icons';
	export let hidden = true;

	// Reactive states
	// let version = '';
	// let checking = false;
	let downloading = false;
	let installing = false;
	// let error: string | null = null;
	let progress = {
		downloaded: 0,
		total: 0,
		percentage: 0
	};
	// let updateInfo: any = null;

	let update: any;

	// Add state variables for update information
	let updateAvailable: boolean = false;
	let currentVersion: string = '';
	let latestVersion: string = '';
	let updateDate: string = '';
	let releaseNotes: string = '';
	let isLoading: boolean = false;
	let updateError: string = '';

	onMount(async () => {
		// Get the current version of the app
		getVersion().then((v) => (currentVersion = v));

		isLoading = true;
		updateError = '';

		console.log('🔍 Starting update check...');

		try {
			const result = await checkForUpdates();
			currentVersion = result.currentVersion;
			updateAvailable = result.updateAvailable;

			if (result.updateAvailable && result.updateInfo) {
				latestVersion = result.updateInfo.version;
				updateDate = result.updateInfo.date || 'No date available';
				releaseNotes = result.updateInfo.body || 'No release notes available';

				console.log('🎉 Update available!', {
					currentVersion: `v${currentVersion}`,
					latestVersion: `v${latestVersion}`,
					releaseDate: updateDate,
					releaseNotes: releaseNotes
				});

				console.log(`📋 Update Details:
					- Current: v${currentVersion}
					- Available: v${latestVersion}
					- Date: ${updateDate}
					- Notes: ${releaseNotes}`);
			} else {
				console.log("✅ You're up to date!", {
					currentVersion: `v${currentVersion}`,
					updateAvailable: false
				});

				console.log(`📋 Version Info:
					- Current: v${currentVersion}
					- Status: No updates available`);
			}
		} catch (err: any) {
			updateError = err.message;
			console.error('❌ Update check failed:', err);

			console.log('⚠️ Update Check Error:', {
				error: err.message,
				timestamp: new Date().toISOString()
			});
		} finally {
			isLoading = false;
			console.log('🔚 Update check completed');
		}
	});

	// Function to handle the update installation
	async function installUpdate() {
		if (!updateAvailable) {
			console.error('No update available to install');
			return;
		}

		downloading = true;
		progress = { downloaded: 0, total: 0, percentage: 0 };

		try {
			await update.downloadAndInstall((event: any) => {
				switch (event.event) {
					case 'Started':
						progress.total = event.data.contentLength;
						break;
					case 'Progress':
						progress.downloaded += event.data.chunkLength;
						progress.percentage = Math.round((progress.downloaded / progress.total) * 100);
						break;
				}
			});

			installing = true;

			await relaunch();
		} catch (err: any) {
			// console.error('Error during update process:', err);
			updateError = `Update failed: ${err}`;
			downloading = false;
			installing = false;
		}
	}
</script>

{#if updateAvailable}
	<div class="relative" role="none">
		<button
			on:click={() => (hidden = !hidden)}
			class={`flex  items-center space-x-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900`}
		>
			<span class="text-base">
				{@html downloadUpdate}
			</span>
		</button>
		<div
			class="absolute -end-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white dark:border-gray-900"
		>
			1
		</div>
	</div>
{/if}

<div
	id="popup-modal"
	tabindex="-1"
	class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm backdrop-brightness-50 transition-opacity {hidden
		? 'pointer-events-none opacity-0'
		: 'opacity-100'}"
>
	<div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
		<div class="space-y-4">
			{#if isLoading}
				<div class="text-center text-gray-600 dark:text-gray-400">Checking for updates...</div>
			{:else if updateAvailable}
				<div class=" space-y-4">
					<h3 class="flex justify-around text-lg font-semibold text-gray-900 dark:text-white">
						Update Available
					</h3>

					<div class="flex justify-around">
						<div class="mb-4 text-xs">
							Current:
							<span
								class="rounded-sm border border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-gray-700 dark:text-orange-400"
							>
								v{currentVersion}
							</span>
						</div>

						<div>
							{@html arrowRight}
						</div>

						<div class="mb-4 text-xs">
							Latest:
							<span
								class="relative rounded-sm border border-green-400 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-gray-700 dark:text-purple-400"
							>
								v{latestVersion}

								<div
									class="absolute -end-4 -top-2 inline-flex h-4 items-center justify-center rounded-lg border-black bg-red-500 px-1 text-[0.5rem] font-bold text-white dark:border-gray-900"
								>
									NEW!
								</div>
							</span>
						</div>
					</div>

					<div class="text-sm text-gray-600 dark:text-gray-400">
						<h4 class="font-medium">Release Notes:</h4>
						<p>{releaseNotes}</p>
						<p class="text-xs text-gray-600 dark:text-gray-400">Release Date: {updateDate}</p>
					</div>
				</div>
			{:else if downloading}
				<div class="space-y-2">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Downloading update ({progress.percentage}%)
					</p>
					<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<div class="h-2 rounded-full bg-blue-600" style="width: {progress.percentage}%"></div>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{Math.round(progress.downloaded / 1024)} KB / {Math.round(progress.total / 1024)} KB
					</p>
				</div>
			{:else if installing}
				<div class="text-center text-gray-600 dark:text-gray-400">Installing update...</div>
			{:else}
				<div class="mb-4 text-xs">
					<span
						class="rounded-sm border border-green-400 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-gray-700 dark:text-green-400"
					>
						v{currentVersion}
					</span>
				</div>
			{/if}

			<div class="flex gap-2">
				{#if updateAvailable}
					<button
						on:click={installUpdate}
						class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Install Update
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="ml-2 size-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
							/>
						</svg>
					</button>
				{:else}
					<button
						on:click={checkForUpdates}
						class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Check for Updates
					</button>
				{/if}

				<button
					on:click={() => (hidden = true)}
					class=" w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 hover:text-white dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div> -->

<script lang="ts">
	import { getVersion } from '@tauri-apps/api/app';
	import { check } from '@tauri-apps/plugin-updater';
	import { relaunch } from '@tauri-apps/plugin-process';
	import { onMount } from 'svelte';
	import { arrowRight, downloadUpdate } from '../Icons/icons';
	import toast from 'svelte-5-french-toast';
	export let hidden = true;

	// Reactive states
	let downloading = false;
	let installing = false;
	let progress = {
		downloaded: 0,
		total: 0,
		percentage: 0
	};

	let update: any; // The update object returned by `check()`

	// Add state variables for update information
	let updateAvailable: boolean = false;
	let currentVersion: string = '';
	let latestVersion: string = '';
	let updateDate: string = '';
	let releaseNotes: string = '';
	let isLoading: boolean = false;
	let updateError: string = '';

	onMount(async () => {
		await checkForUpdates();
	});

	// Function to check for updates and store the update object
	async function checkForUpdates() {
		isLoading = true;
		updateError = '';
		console.log('🔍 Starting update check...');

		try {
			const updateCheckResult = await check(); // This is the crucial line

			if (updateCheckResult?.available) {
				update = updateCheckResult;
				updateAvailable = true;
				currentVersion = await getVersion();
				latestVersion = update.version;
				updateDate = update.date || 'No date available';
				releaseNotes = update.body || 'No release notes available';

				console.log('🎉 Update available!', {
					currentVersion: `v${currentVersion}`,
					latestVersion: `v${latestVersion}`,
					releaseDate: updateDate,
					releaseNotes: releaseNotes
				});
			} else {
				updateAvailable = false;
				currentVersion = await getVersion();
				console.log("✅ You're up to date!", {
					currentVersion: `v${currentVersion}`,
					updateAvailable: false
				});
			}
		} catch (err: any) {
			updateError = err.message;
			console.error('❌ Update check failed:', err);
		} finally {
			isLoading = false;
			console.log('🔚 Update check completed');
		}
	}

	// Function to handle the update installation
	async function installUpdate() {
		if (!updateAvailable || !update) {
			console.error('No update available or update object not found.');
			return;
		}

		downloading = true;
		progress = { downloaded: 0, total: 0, percentage: 0 };
		updateError = '';

		try {
			await update.downloadAndInstall((event: any) => {
				switch (event.event) {
					case 'Started':
						progress.total = event.data.contentLength;
						break;
					case 'Progress':
						progress.downloaded += event.data.chunkLength;
						progress.percentage = Math.round((progress.downloaded / progress.total) * 100);
						break;
				}
			});

			installing = true;
			await relaunch();
		} catch (err: any) {
			updateError = `Update failed: ${err.message || err}`;

			toast.error(`Update failed: ${err.message || err}`, {
				position: 'bottom-right'
			});

			console.error('Error during update process:', err);
			downloading = false;
			installing = false;
		}
	}
</script>

{#if updateAvailable}
	<div class="relative" role="none">
		<button
			on:click={() => (hidden = !hidden)}
			class={`flex  items-center space-x-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900`}
		>
			<span class="text-base">
				{@html downloadUpdate}
			</span>
		</button>
		<div
			class="absolute -end-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white dark:border-gray-900"
		>
			1
		</div>
	</div>
{/if}

<div
	id="popup-modal"
	tabindex="-1"
	class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm backdrop-brightness-50 transition-opacity {hidden
		? 'pointer-events-none opacity-0'
		: 'opacity-100'}"
>
	<div class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
		<div class="space-y-4">
			{#if isLoading}
				<div class="text-center text-gray-600 dark:text-gray-400">Checking for updates...</div>
			{:else if updateAvailable}
				<div class=" space-y-4">
					<h3 class="flex justify-around text-lg font-semibold text-gray-900 dark:text-white">
						Update Available
					</h3>

					<div class="flex justify-around">
						<div class="mb-4 text-xs">
							Current:
							<span
								class="rounded-sm border border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-gray-700 dark:text-orange-400"
							>
								v{currentVersion}
							</span>
						</div>

						<div>
							{@html arrowRight}
						</div>

						<div class="mb-4 text-xs">
							Latest:
							<span
								class="relative rounded-sm border border-green-400 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-gray-700 dark:text-purple-400"
							>
								v{latestVersion}

								<div
									class="absolute -end-4 -top-2 inline-flex h-4 items-center justify-center rounded-lg border-black bg-red-500 px-1 text-[0.5rem] font-bold text-white dark:border-gray-900"
								>
									NEW!
								</div>
							</span>
						</div>
					</div>

					<div class="text-sm text-gray-600 dark:text-gray-400">
						<h4 class="font-medium">Release Notes:</h4>
						<p>{releaseNotes}</p>
						<p class="text-xs text-gray-600 dark:text-gray-400">Release Date: {updateDate}</p>
					</div>
				</div>
			{:else if downloading}
				<div class="space-y-2">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Downloading update ({progress.percentage}%)
					</p>
					<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<div class="h-2 rounded-full bg-blue-600" style="width: {progress.percentage}%"></div>
					</div>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{Math.round(progress.downloaded / 1024)} KB / {Math.round(progress.total / 1024)} KB
					</p>
				</div>
			{:else if installing}
				<div class="text-center text-gray-600 dark:text-gray-400">Installing update...</div>
			{:else}
				<div class="mb-4 text-xs">
					<span
						class="rounded-sm border border-green-400 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-gray-700 dark:text-green-400"
					>
						v{currentVersion}
					</span>
				</div>
			{/if}

			<div class="flex gap-2">
				{#if updateAvailable}
					<button
						on:click={installUpdate}
						class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Install Update
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="ml-2 size-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
							/>
						</svg>
					</button>
				{:else}
					<button
						on:click={checkForUpdates}
						class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Check for Updates
					</button>
				{/if}

				<button
					on:click={() => (hidden = true)}
					class=" w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 hover:text-white dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>
