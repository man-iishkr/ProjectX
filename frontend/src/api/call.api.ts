import api from './axios';

export interface CallReportData {
    doctorId: string;
    latitude: number;
    longitude: number;
    remarks?: string;
    digipin?: string;
    products?: string[];
    alongWith?: string[];
}

export const createCallReport = async (data: CallReportData) => {
    try {
        const response = await api.post('/call-reports', data);
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to submit call report'
        };
    }
};

export const getCallReports = async (filters?: any) => {
    try {
        const response = await api.get('/call-reports', { params: filters });
        return { success: true, data: response.data.data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to fetch call reports'
        };
    }
};
