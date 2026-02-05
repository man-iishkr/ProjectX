import api from './axios';

export const getHQs = async () => {
    const { data } = await api.get('/hqs');
    return data;
};

export const createHQ = async (hqData: any) => {
    const { data } = await api.post('/hqs', hqData);
    return data;
};

export const deleteHQ = async (id: string) => {
    const { data } = await api.delete(`/hqs/${id}`);
    return data;
};
