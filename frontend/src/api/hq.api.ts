import api from './axios';

export const getHQs = async () => {
    const { data } = await api.get('/hqs');
    return data;
};

export const createHQ = async (hqData: any) => {
    const { data } = await api.post('/hqs', hqData);
    return data;
};
