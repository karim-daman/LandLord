export const generateId = (): string => {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount);
};

export const formatDate = (dateString: string): string => {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

export const getStatusColor = (status: string): string => {
	switch (status.toLowerCase()) {
		case 'active':
			return 'bg-green-100 text-green-800 border-green-200';
		case 'pending':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		case 'expired':
			return 'bg-red-100 text-red-800 border-red-200';
		case 'terminated':
			return 'bg-red-300 text-red-800 border-red-500';
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200';
	}
};

export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
	const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
	return phoneRegex.test(phone);
};
