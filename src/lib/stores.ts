import { writable } from 'svelte/store';
import pkg from 'lodash';
const { debounce } = pkg;

import {
	readTextFile,
	writeTextFile,
	BaseDirectory,
	exists,
	mkdir,
	readFile,
	writeFile
} from '@tauri-apps/plugin-fs';
import type { Tenant, Property, LeaseAgreement, PropertyImage } from '../types';

export const tenants = writable<Tenant[]>([]);
export const properties = writable<Property[]>([]);
export const leaseAgreements = writable<LeaseAgreement[]>([]);

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

// Image handling functions
export async function savePropertyImage(
	file: File,
	propertyId: string
): Promise<PropertyImage | null> {
	try {
		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		if (!fileExtension || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension)) {
			throw new Error('Unsupported image format');
		}

		const timestamp = Date.now();
		const fileName = `${propertyId}_${timestamp}.${fileExtension}`;
		const filePath = `LandLord/images/${fileName}`;

		// Convert File to Uint8Array
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Write the image file to the images folder
		await writeFile(filePath, uint8Array, {
			baseDir: BaseDirectory.Desktop
		});

		// Create PropertyImage object
		const propertyImage: PropertyImage = {
			id: `img_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
			filename: file.name,
			path: filePath,
			uploadedAt: new Date().toISOString(),
			caption: ''
		};

		console.log(`Image saved successfully: ${fileName}`);
		return propertyImage;
	} catch (error) {
		console.error('Error saving property image:', error);
		return null;
	}
}

export async function saveMultiplePropertyImages(
	files: FileList,
	propertyId: string
): Promise<PropertyImage[]> {
	const savedImages: PropertyImage[] = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const savedImage = await savePropertyImage(file, propertyId);
		if (savedImage) {
			savedImages.push(savedImage);
		}
	}

	return savedImages;
}

export async function deletePropertyImage(imagePath: string): Promise<boolean> {
	try {
		// Check if file exists before trying to delete
		const fileExists = await exists(imagePath, { baseDir: BaseDirectory.Desktop });
		if (fileExists) {
			// Note: Tauri plugin-fs doesn't have a direct delete function in the current API
			// You might need to use the remove function if available, or handle this differently
			console.log(`Would delete image: ${imagePath}`);
			// await remove(imagePath, { baseDir: BaseDirectory.Desktop });
		}
		return true;
	} catch (error) {
		console.error('Error deleting property image:', error);
		return false;
	}
}

export async function getImageAsBase64(imagePath: string): Promise<string | null> {
	try {
		const imageData = await readFile(imagePath, { baseDir: BaseDirectory.Desktop });

		// Use a more efficient base64 conversion method
		const base64 = arrayBufferToBase64(imageData);

		// Determine MIME type based on file extension
		const extension = imagePath.split('.').pop()?.toLowerCase();
		let mimeType = 'image/jpeg'; // default

		switch (extension) {
			case 'png':
				mimeType = 'image/png';
				break;
			case 'webp':
				mimeType = 'image/webp';
				break;
			case 'gif':
				mimeType = 'image/gif';
				break;
		}

		return `data:${mimeType};base64,${base64}`;
	} catch (error) {
		console.error('Error reading image file:', error);
		return null;
	}
}

// Helper function to convert ArrayBuffer/Uint8Array to base64
function arrayBufferToBase64(buffer: Uint8Array): string {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const chunkSize = 0x8000; // 32KB chunks - larger chunks for better performance

	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}

export async function cleanupPropertyImages(propertyId: string): Promise<void> {
	try {
		// Get current properties to find images that should be kept
		const currentProperties = await loadFromFile<Property>('properties');
		const property = currentProperties.find((p) => p.id === propertyId);

		if (property && property.images) {
			// Clean up any orphaned images for this property
			// This would require additional logic to scan the images folder
			// and compare with the current property images
			console.log(`Cleanup images for property: ${propertyId}`);
		}
	} catch (error) {
		console.error('Error during image cleanup:', error);
	}
}

export async function initializeAllStores(): Promise<{ success: boolean; message: string }> {
	try {
		await ensureDataFolder(); // Only call once
		await Promise.all([
			initializeTenantsStore(),
			initializePropertiesStore(),
			initializeLeaseAgreementsStore()
		]);

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

	// Create images subdirectory for storing property images
	const imagesFolderExist = await exists('LandLord/images', { baseDir: BaseDirectory.Desktop });
	if (!imagesFolderExist) {
		console.log('Images folder does not exist, creating one..');
		await mkdir('LandLord/images', { baseDir: BaseDirectory.Desktop });
	}

	const files = ['Tenants.txt', 'Properties.txt', 'LeaseAgreements.txt'];

	await Promise.all(
		files.map(async (file) => {
			const filePath = `LandLord/${file}`;
			if (!(await exists(filePath, { baseDir: BaseDirectory.Desktop }))) {
				await writeTextFile(filePath, '[]', { baseDir: BaseDirectory.Desktop });
			}
		})
	);
}

export async function initializeTenantsStore() {
	await initializeStore(tenants, 'tenants', (data: Tenant[]) => tenants.set(data));
}

export async function initializePropertiesStore() {
	await initializeStore(properties, 'properties', (data: Property[]) => properties.set(data));
}

export async function initializeLeaseAgreementsStore() {
	await initializeStore(leaseAgreements, 'leaseAgreements', (data: LeaseAgreement[]) =>
		leaseAgreements.set(data)
	);
}
