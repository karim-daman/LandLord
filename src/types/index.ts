export interface Tenant {
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
	propertyType: 'complex' | 'house' | 'apartment' | 'commercial';
	name?: string; // e.g., "The Grand Apartments" or "The Willow Creek Mall"
	description: string;
	images: PropertyImage[];
	createdAt: string;
	updatedAt: string;
	units: Unit[];
	leases: LeaseAgreement[]; // Added to track all leases associated with the property
}

export interface Unit {
	id: string;
	unitNumber: string; // e.g., "1A", "Unit 203"
	bedrooms: number;
	bathrooms: number;
	squareFeet: number;
	monthlyRent: number;
	deposit: number;
	description: string;
	amenities: string[];
	images: PropertyImage[];
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
	tenantId: string;
	propertyId: string;
	unitId: string;
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

export type EntityType = 'tenants' | 'properties' | 'leases';
