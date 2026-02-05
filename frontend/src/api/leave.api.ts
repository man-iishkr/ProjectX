import api from './axios';

export interface Leave {
    _id: string;
    employee: {
        _id: string;
        name: string;
        email: string;
        employeeId: string;
    };
    leaveType: 'sick' | 'casual' | 'earned' | 'unpaid' | 'emergency';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
    attachments?: string[];
    createdAt: string;
    updatedAt: string;
    durationDays?: number;
}

export interface LeaveStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: {
        sick: number;
        casual: number;
        earned: number;
        unpaid: number;
        emergency: number;
    };
}

export const leaveAPI = {
    getAll: async (): Promise<Leave[]> => {
        const { data } = await api.get('/leave');
        return data;
    },

    getById: async (id: string): Promise<Leave> => {
        const { data } = await api.get(`/leave/${id}`);
        return data;
    },

    create: async (leaveData: Partial<Leave>) => {
        const { data } = await api.post('/leave', leaveData);
        return data;
    },

    update: async (id: string, leaveData: Partial<Leave>) => {
        const { data } = await api.put(`/leave/${id}`, leaveData);
        return data;
    },

    approve: async (id: string) => {
        const { data } = await api.patch(`/leave/${id}/approve`);
        return data;
    },

    reject: async (id: string, rejectionReason: string) => {
        const { data } = await api.patch(`/leave/${id}/reject`, { rejectionReason });
        return data;
    },

    cancel: async (id: string) => {
        const { data } = await api.patch(`/leave/${id}/cancel`);
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/leave/${id}`);
        return data;
    },

    getStats: async (params?: { employeeId?: string; year?: number }): Promise<LeaveStats> => {
        const { data } = await api.get('/leave/stats', { params });
        return data;
    }
};
