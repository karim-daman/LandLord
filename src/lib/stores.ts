import { writable } from 'svelte/store';
import pkg from 'lodash';
const { debounce } = pkg;

import { readTextFile, writeTextFile, BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs';
import type { Client, Property, LeaseAgreement } from '../types';

export const clients = writable<Client[]>([]);
export const properties = writable<Property[]>([]);
export const leaseAgreement = writable<LeaseAgreement[]>([]);

async function saveToFile(data: any, filename: string) {
	if (!data) return;
	try {
		await writeTextFile(`LandLord/${filename}.txt`, JSON.stringify(data, null, 2), {
			baseDir: BaseDirectory.Desktop
		});
	} catch (error) {
		console.error(`Error saving ${filename}:`, error);
	}
}

async function loadFromFile<T>(filename: string): Promise<T[]> {
	try {
		const content = await readTextFile(`LandLord/${filename}.txt`, {
			baseDir: BaseDirectory.Desktop
		});
		return JSON.parse(content) as T[];
	} catch (error) {
		console.error(`Error loading ${filename}:`, error);
		return [];
	}
}

function debounceSave<T>(filename: string) {
	return debounce(async (data: T[]) => {
		await saveToFile(data, filename);
	}, 500);
}

async function initializeStore<T>(store: any, filename: string, setter: (data: T[]) => void) {
	try {
		const data = await loadFromFile<T>(filename);
		setter(data);
		const debouncedSave = debounceSave<T>(filename);
		store.subscribe(debouncedSave);
	} catch (error) {
		console.error(`Error initializing ${filename} store:`, error);
	}
}

export async function initializeAllStores(): Promise<{ success: boolean; message: string }> {
	try {
		await ensureDataFolder(); // Only call once
		await Promise.all([
			initializeClientsStore(),
			initializePropertiesStore(),
			initializeLeaseAgreementStore()
		]);

		// initialized = true; // Only set to true if no errors occurred
		return { success: true, message: 'All stores initialized successfully.' };
	} catch (error) {
		console.error('Error initializing stores:', error);
		return {
			success: false,
			message: `Failed to initialize stores: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}

async function ensureDataFolder() {
	const dataFolderExist = await exists('LandLord', { baseDir: BaseDirectory.Desktop });

	if (!dataFolderExist) {
		console.log('Data folder does not exist, creating one..');
		await mkdir('LandLord', { baseDir: BaseDirectory.Desktop });
	}

	const files = ['Clients.txt', 'Properties.txt', 'LeaseAgreement.txt'];

	await Promise.all(
		files.map(async (file) => {
			const filePath = `LandLord/${file}`;
			if (!(await exists(filePath, { baseDir: BaseDirectory.Desktop }))) {
				await writeTextFile(filePath, '[]', { baseDir: BaseDirectory.Desktop });
			}
		})
	);
}

export async function initializeClientsStore() {
	await initializeStore(clients, 'clients', (data: Client[]) => clients.set(data));
}

export async function initializePropertiesStore() {
	await initializeStore(properties, 'properties', (data: Property[]) => properties.set(data));
}

export async function initializeLeaseAgreementStore() {
	await initializeStore(leaseAgreement, 'leaseAgreement', (data: LeaseAgreement[]) =>
		leaseAgreement.set(data)
	);
}
