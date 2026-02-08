import api from './axios';

export const API_URL = 'http://localhost:5000/api/v1';

export const loginUser = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const getMe = async () => {
    const { data } = await api.get('/auth/me');
    return data;
};

export const logoutUser = async () => {
    // Clear cookie manually if needed or call logout endpoint
    // Implementation depends on backend logout. 
    // For now just client side clear state.
};
