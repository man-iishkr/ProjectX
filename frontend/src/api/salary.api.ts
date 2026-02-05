import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/salary';

// In a real app, you'd attach the token from context/localStorage
// Assuming axios interceptor handles it, or we add it here manually if needed.
// For now, relying on global interceptor if it exists, or adding basic headers.

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getSalaries = async (filters: any) => {
    const query = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}?${query}`, getAuthHeaders());
    return response.data;
};

export const getSalaryById = async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};

// This functions as "Generate Salary" too
export const upsertSalary = async (data: any) => {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
};

export const updatePaymentStatus = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/${id}/payment`, data, getAuthHeaders());
    return response.data;
};

export const getSalaryStats = async (period: { year: number, month: number }) => {
    const response = await axios.get(`${API_URL}/stats?year=${period.year}&month=${period.month}`, getAuthHeaders());
    return response.data;
};

export const deleteSalary = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
};
