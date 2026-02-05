import api from './axios';

export interface Analytics {
    _id: string;
    employee: {
        _id: string;
        name: string;
        email: string;
        employeeId: string;
    };
    hq?: {
        _id: string;
        name: string;
        code: string;
    };
    period: {
        year: number;
        month: number;
    };
    targets: {
        doctorVisits: { target: number; achieved: number };
        chemistVisits: { target: number; achieved: number };
        sales: { target: number; achieved: number };
        callReports: { target: number; achieved: number };
    };
    visitFrequency: {
        totalVisits: number;
        uniqueDoctors: number;
        uniqueChemists: number;
        averageVisitsPerDay: number;
        peakVisitDay: string | null;
    };
    performance: {
        attendancePercentage: number;
        onTimeReporting: number;
        expenseCompliance: number;
        overallScore: number;
    };
    coverage: {
        regionsAssigned: number;
        regionsCovered: number;
        coveragePercentage: number;
    };
    createdAt: string;
    updatedAt: string;
    completionPercentage?: number;
}

export interface DashboardSummary {
    totalEmployees: number;
    totalVisits: number;
    averageCompletion: number;
    topPerformers: Array<{
        employee: any;
        completion: number;
        totalVisits: number;
    }>;
}

export const analyticsAPI = {
    getAll: async (params?: {
        employeeId?: string;
        year?: number;
        month?: number;
        hqId?: string;
    }): Promise<Analytics[]> => {
        const { data } = await api.get('/analytics', { params });
        return data;
    },

    getById: async (id: string): Promise<Analytics> => {
        const { data } = await api.get(`/analytics/${id}`);
        return data;
    },

    upsert: async (analyticsData: Partial<Analytics>) => {
        const { data } = await api.post('/analytics', analyticsData);
        return data;
    },

    generate: async (params: { employeeId: string; year: number; month: number }) => {
        const { data } = await api.post('/analytics/generate', params);
        return data;
    },

    getSummary: async (params?: {
        year?: number;
        month?: number;
        hqId?: string;
    }): Promise<DashboardSummary> => {
        const { data } = await api.get('/analytics/summary', { params });
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/analytics/${id}`);
        return data;
    }
};
