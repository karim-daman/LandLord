import { Client, Property, LeaseAgreement } from '../types';

const STORAGE_KEYS = {
	clients: 'lease_tracker_clients',
	properties: 'lease_tracker_properties',
	leases: 'lease_tracker_leases'
};

export const storage = {
	// Generic storage functions
	get<T>(key: string): T[] {
		try {
			const data = localStorage.getItem(key);
			return data ? JSON.parse(data) : [];
		} catch {
			return [];
		}
	},

	set<T>(key: string, data: T[]): void {
		localStorage.setItem(key, JSON.stringify(data));
	},

	// Client operations
	getClients(): Client[] {
		return this.get<Client>(STORAGE_KEYS.clients);
	},

	setClients(clients: Client[]): void {
		this.set(STORAGE_KEYS.clients, clients);
	},

	// Property operations
	getProperties(): Property[] {
		return this.get<Property>(STORAGE_KEYS.properties);
	},

	setProperties(properties: Property[]): void {
		this.set(STORAGE_KEYS.properties, properties);
	},

	// Lease operations
	getLeases(): LeaseAgreement[] {
		return this.get<LeaseAgreement>(STORAGE_KEYS.leases);
	},

	setLeases(leases: LeaseAgreement[]): void {
		this.set(STORAGE_KEYS.leases, leases);
	}
};
