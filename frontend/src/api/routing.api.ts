import api from './axios';

export const getRoutes = async () => {
    const { data } = await api.get('/routes');
    return data;
};

export const getRoute = async (id: string) => {
    const { data } = await api.get(`/routes/${id}`);
    return data;
};

export const createRoute = async (routeData: any) => {
    const { data } = await api.post('/routes', routeData);
    return data;
};

export const updateRoute = async (id: string, routeData: any) => {
    const { data } = await api.put(`/routes/${id}`, routeData);
    return data;
};

export const deleteRoute = async (id: string) => {
    const { data } = await api.delete(`/routes/${id}`);
    return data;
};
