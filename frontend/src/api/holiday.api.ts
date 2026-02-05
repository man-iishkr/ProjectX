import api from './axios';

export interface Holiday {
    _id: string;
    name: string;
    date: string;
    description?: string;
}

export const holidayAPI = {
    getAll: async (): Promise<Holiday[]> => {
        const { data } = await api.get('/holidays');
        return data.data;
    },

    create: async (holidayData: Partial<Holiday>) => {
        const { data } = await api.post('/holidays', holidayData);
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/holidays/${id}`);
        return data;
    }
};
