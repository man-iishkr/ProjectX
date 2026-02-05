import axios from './axios';

export const getChemists = async () => {
    try {
        const response = await axios.get('/chemists');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getChemist = async (id: string) => {
    try {
        const response = await axios.get(`/chemists/${id}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const createChemist = async (data: any) => {
    try {
        const response = await axios.post('/chemists', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const updateChemist = async (id: string, data: any) => {
    try {
        const response = await axios.put(`/chemists/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const deleteChemist = async (id: string) => {
    try {
        const response = await axios.delete(`/chemists/${id}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
