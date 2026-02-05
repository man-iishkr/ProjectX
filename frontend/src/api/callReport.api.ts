import api from './axios';

export const callReportAPI = {
    getAll: async (params?: {
        employeeId?: string;
        startDate?: string;
        endDate?: string;
        hqId?: string;
    }) => {
        const { data } = await api.get('/call-reports', { params });
        return data;
    },

    create: async (reportData: any) => {
        const { data } = await api.post('/call-reports', reportData);
        return data;
    }
};
