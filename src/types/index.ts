export interface Client {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address: string;
	dateOfBirth: string;
	emergencyContact: string;
	emergencyPhone: string;
	createdAt: string;
	updatedAt: string;
}

export interface Property {
	id: string;
	address: string;
	city: string;
	state: string;
	zipCode: string;
	propertyType: 'apartment' | 'house' | 'garage' | 'commercial';
	bedrooms: number;
	bathrooms: number;
	squareFeet: number;
	monthlyRent: number;
	deposit: number;
	amenities: string[];
	description: string;
	images: PropertyImage[]; // Added images array
	isAvailable: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface PropertyImage {
	id: string;
	filename: string;
	path: string;
	caption?: string;
	uploadedAt: string;
}

export interface LeaseAgreement {
	id: string;
	clientId: string;
	propertyId: string;
	startDate: string;
	endDate: string;
	monthlyRent: number;
	securityDeposit: number;
	status: 'active' | 'expired' | 'terminated' | 'pending';
	terms: string;
	specialConditions: string;
	signedDate: string;
	createdAt: string;
	updatedAt: string;
}

export type EntityType = 'clients' | 'properties' | 'leases';
