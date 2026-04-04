import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1', // Uses env var if available, else falls back to local proxy
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // CRITICAL: Ensures httpOnly auth cookies are sent with every request
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
