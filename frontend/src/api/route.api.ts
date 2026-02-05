import api from './axios';

export const getRoutes = async () => {
    const { data } = await api.get('/routes');
    return data;
};

export const createRoute = async (routeData: any) => {
    const { data } = await api.post('/routes', routeData);
    return data;
};
