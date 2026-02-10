import api from './axios';

export const getProducts = async () => {
    try {
        // Assuming admin route or public route for products? 
        // Admin route: /api/v1/inventory/products
        // Or if there's a specific route for employees?
        // Let's assume generic GET /api/v1/inventory/products works for authenticated users
        const response = await api.get('/inventory/products');
        return { success: true, data: response.data.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch products'
        };
    }
};
