import api from './axios';

export const getSettings = async () => {
    try {
        const response = await api.get('/settings');
        return response.data;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
};
