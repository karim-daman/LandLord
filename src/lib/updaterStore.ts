// src/updaterStore.ts
import { writable } from 'svelte/store';
import { getVersion } from '@tauri-apps/api/app';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type { UpdateInfo } from './updateManager';
import toast from 'svelte-5-french-toast';

// Define the store's state type
export interface UpdaterState {
	isLoading: boolean;
	updateAvailable: boolean;
	currentVersion: string | null;
	latestVersion: string | null;
	updateInfo: Update | null;
	error: string | null;
	downloading: boolean;
	progress: {
		downloaded: number;
		total: number;
		percentage: number;
	};
}

// Create the writable store with initial state
const initialState: UpdaterState = {
	isLoading: false,
	updateAvailable: false,
	currentVersion: null,
	latestVersion: null,
	updateInfo: null,
	error: null,
	downloading: false,
	progress: {
		downloaded: 0,
		total: 0,
		percentage: 0
	}
};

export const updater = writable<UpdaterState>(initialState);

// --- Store Methods ---

// This flag ensures the check only runs once
let isCheckInProgress = false;

// Export the function to check for updates
export async function checkForUpdates() {
	// Only run the check if it's not already in progress
	if (isCheckInProgress) {
		console.log('Update check already in progress. Skipping...');
		return;
	}

	isCheckInProgress = true;
	updater.update((state) => ({ ...state, isLoading: true, error: null }));
	console.log('🔍 Starting update check from store...');

	try {
		const update = await check();

		if (update) {
			console.log('🎉 Update available!');
			const currentVersion = await getVersion();
			updater.update((state) => ({
				...state,
				updateAvailable: true,
				currentVersion,
				latestVersion: update.version,
				updateInfo: update
			}));
		} else {
			console.log("✅ You're up to date!");

			toast.success("You're up to date!", {
				position: 'bottom-right'
			});

			const currentVersion = await getVersion();
			updater.update((state) => ({
				...state,
				updateAvailable: false,
				currentVersion,
				latestVersion: currentVersion,
				updateInfo: null
			}));
		}
	} catch (err: any) {
		console.error('❌ Update check failed:', err);
		updater.update((state) => ({ ...state, error: err.message }));
	} finally {
		updater.update((state) => ({ ...state, isLoading: false }));
		isCheckInProgress = false; // Reset the flag
		console.log('🔚 Update check completed from store.');
	}
}
// Export the function to download and install the update
export async function installUpdate(update: Update) {
	if (!update) {
		updater.update((state) => ({ ...state, error: 'No update object provided' }));
		return;
	}

	updater.update((state) => ({ ...state, downloading: true, error: null }));

	try {
		await update.downloadAndInstall((event: any) => {
			switch (event.event) {
				case 'Started':
					updater.update((state) => ({
						...state,
						progress: { downloaded: 0, total: event.data.contentLength, percentage: 0 }
					}));
					break;
				case 'Progress':
					updater.update((state) => {
						const downloaded = state.progress.downloaded + event.data.chunkLength;
						const percentage = Math.round((downloaded / state.progress.total) * 100);
						return {
							...state,
							progress: { ...state.progress, downloaded, percentage }
						};
					});
					break;
			}
		});

		// This line will be executed after a successful download and install
		await relaunch();
	} catch (err: any) {
		console.error('Error during update process:', err);
		updater.update((state) => ({ ...state, error: err.message, downloading: false }));
	}
}
