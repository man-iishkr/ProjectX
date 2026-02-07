import axios from './axios';

export const getRoutes = async (params?: any) => {
    try {
        const res = await axios.get('/routes', { params });
        if (res.data.success) {
            return res.data;
        }
        return { success: false, error: 'Failed to fetch routes' };
    } catch (error: any) {
        console.error('Error fetching routes:', error);
        return { success: false, error: error.response?.data?.error || 'Failed to fetch routes' };
    }
};

export const createRoute = async (data: any) => {
    try {
        const res = await axios.post('/routes', data);
        if (res.data.success) {
            return res.data;
        }
        return { success: false, error: 'Failed to create route' };
    } catch (error: any) {
        console.error('Error creating route:', error);
        return { success: false, error: error.response?.data?.error || 'Failed to create route' };
    }
};

export const searchRoutes = async (query: string, hq?: string) => {
    try {
        const res = await axios.get('/routes/search', {
            params: { query, hq }
        });
        if (res.data.success) {
            return res.data.data;
        }
        return [];
    } catch (error) {
        console.error('Route Search Error:', error);
        return [];
    }
};
