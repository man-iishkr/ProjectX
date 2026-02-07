import api from './axios';

export const getStockists = async (hqId?: string) => {
    const params = hqId ? { hq: hqId } : {};
    const { data } = await api.get('/stockists', { params });
    return data;
};

export const getStockist = async (id: string) => {
    const { data } = await api.get(`/stockists/${id}`);
    return data;
};

export const createStockist = async (stockistData: any) => {
    const { data } = await api.post('/stockists', stockistData);
    return data;
};

export const updateStockist = async (id: string, stockistData: any) => {
    const { data } = await api.put(`/stockists/${id}`, stockistData);
    return data;
};

export const deleteStockist = async (id: string) => {
    const { data } = await api.delete(`/stockists/${id}`);
    return data;
};
