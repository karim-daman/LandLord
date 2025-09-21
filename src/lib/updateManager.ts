import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';

/**
 * Interface for update information
 */
export interface UpdateInfo {
	version: string;
	date: string | undefined;
	body: string;
	[key: string]: any;
}

/**
 * Interface for the update checker result
 */
export interface UpdateCheckResult {
	currentVersion: string;
	updateAvailable: boolean;
	updateInfo: UpdateInfo | null;
}

/**
 * Checks if an update is available for the Tauri application
 * @returns Promise resolving to an object containing update information
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
	// Get the current version of the app
	let currentVersion: string;
	try {
		currentVersion = await getVersion();
	} catch (err: any) {
		// console.error('Failed to get app version:', err);
		throw new Error(`Failed to get app version: ${err.message}`);
	}

	// Check for updates
	try {
		// console.log('Checking for updates...');
		const update = await check();

		if (update) {
			console.log(`Update found: v${update.version} (${update.date})`);
			console.log('Release notes:', update.body);

			return {
				currentVersion,
				updateAvailable: true,
				updateInfo: update
			};
		} else {
			console.log('No updates available');

			return {
				currentVersion,
				updateAvailable: false,
				updateInfo: null
			};
		}
	} catch (err: any) {
		// console.error('Error checking for updates:', err);
		throw new Error(`Failed to check for updates: ${err.message}`);
	}
}

/**
 * Checks if the current version is different from the latest version
 * @returns Promise resolving to a boolean indicating if an update is available
 */
export async function isUpdateAvailable(): Promise<any> {
	try {
		const result = await checkForUpdates();
		return result;
	} catch (err) {
		// console.error('Error checking for updates:', err);
		throw err;
	}
}
