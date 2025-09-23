<script lang="ts">
	import { onMount } from 'svelte';
	import { arrowRight, downloadUpdate } from '../Icons/icons';
	import toast from 'svelte-5-french-toast';

	// Import the updater store and its functions
	import { updater, checkForUpdates, installUpdate } from '../../lib/updaterStore';

	export let hidden = true;

	// The component's local reactive state will now be derived from the store.
	// The `$updater` syntax automatically subscribes to the store.
	$: updateAvailable = $updater.updateAvailable;
	$: currentVersion = $updater.currentVersion;
	$: latestVersion = $updater.latestVersion;
	$: updateDate = $updater.updateInfo?.date || 'No date available';
	$: releaseNotes = $updater.updateInfo?.body || 'No release notes available';
	$: isLoading = $updater.isLoading;
	$: downloading = $updater.downloading;
	$: progress = $updater.progress;

	// A local flag to ensure the initial check is only run once per session
	let initialCheckDone = false;

	onMount(async () => {
		// Run the check only once when the component is first mounted
		// and the check hasn't been performed yet.
		if (!initialCheckDone) {
			await checkForUpdates();
			initialCheckDone = true;
		}
	});

	// Function to handle the update installation
	async function handleInstall() {
		if (!$updater.updateAvailable || !$updater.updateInfo) {
			console.error('No update available or update object not found.');
			return;
		}

		try {
			// The installUpdate function from the store handles the downloading
			// and progress updates internally.
			await installUpdate($updater.updateInfo);
		} catch (err: any) {
			toast.error(`Update failed: ${err.message || err}`, {
				position: 'bottom-right'
			});

			console.error('Error during update process:', err);
		}
	}

	function handleManualCheck() {
		checkForUpdates();
	}
</script>

{#if updateAvailable}
	<div class="relative" role="none">
		<button
			on:click={() => (hidden = !hidden)}
			class={`flex items-center space-x-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900`}
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
{:else}
	<button on:click={handleManualCheck} class="mb-4 text-xs">
		<span
			class="rounded-sm border border-green-400 bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-gray-700 dark:text-purple-400"
		>
			v{currentVersion}
		</span>
	</button>
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
				<div class="space-y-4">
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
			{/if}

			{#if downloading}
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
			{/if}

			<div class="flex gap-2">
				{#if updateAvailable}
					<button
						on:click={handleInstall}
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
				{/if}

				<button
					on:click={() => (hidden = true)}
					class="w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 hover:text-white dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</div>
