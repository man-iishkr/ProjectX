import axios from './axios';

export const getTargets = async () => {
    try {
        const response = await axios.get('/operations/targets');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const createBulkTargets = async (data: { hq: string, year: number, targets: number[] }) => {
    try {
        const response = await axios.post('/operations/targets/bulk', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const deleteTarget = async (id: string) => {
    try {
        const response = await axios.delete(`/operations/targets/${id}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const deleteAnnualTarget = async (hq: string, year: number) => {
    try {
        const response = await axios.delete(`/operations/targets/annual?hq=${hq}&year=${year}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
