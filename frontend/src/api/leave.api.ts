import api from './axios';

export interface Leave {
    _id: string;
    employee: any;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approvedBy?: any;
    rejectionReason?: string;
    createdAt: string;
}

export const getLeaves = async () => {
    try {
        const { data } = await api.get('/leaves');
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch leaves'
        };
    }
};

export const getLeaveStats = async (year?: number) => {
    try {
        const query = year ? `?year=${year}` : '';
        const { data } = await api.get(`/leaves/stats${query}`);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch leave stats'
        };
    }
};

export const createLeave = async (leaveData: any) => {
    try {
        const { data } = await api.post('/leaves', leaveData);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to create leave request'
        };
    }
};

export const updateLeave = async (id: string, leaveData: any) => {
    try {
        const { data } = await api.put(`/leaves/${id}`, leaveData);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to update leave request'
        };
    }
};

export const cancelLeave = async (id: string) => {
    try {
        const { data } = await api.patch(`/leaves/${id}/cancel`); // Removed empty body {} as patch can take none or handled by axios
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to cancel leave request'
        };
    }
};

export const approveLeave = async (id: string) => {
    try {
        const { data } = await api.patch(`/leaves/${id}/approve`);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to approve leave request'
        };
    }
};

export const rejectLeave = async (id: string, reason: string) => {
    try {
        const { data } = await api.patch(`/leaves/${id}/reject`, { rejectionReason: reason });
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to reject leave request'
        };
    }
};

export const deleteLeave = async (id: string) => {
    try {
        const { data } = await api.delete(`/leaves/${id}`);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete leave request'
        };
    }
};
