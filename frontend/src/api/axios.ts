import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1', // Proxied to backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        // Check if token exists in cookies? 
        // Actually we used httpOnly cookie, so browser sends it automatically.
        // If we used localStorage, we would add header here.
        // backend sends httpOnly cookie.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
