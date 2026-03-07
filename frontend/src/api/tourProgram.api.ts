import api from './axios';

export const getMyTourPrograms = async (params?: { year?: number; month?: number }) => {
    const response = await api.get('/tour-programs/my-plans', { params });
    return response.data;
};

export const getTourProgramsForApproval = async (params?: { year?: number; month?: number; status?: string; employeeId?: string }) => {
    const response = await api.get('/tour-programs/approvals', { params });
    return response.data;
};

export const upsertTourProgram = async (data: { year: number; month: number; dailyPlans: any[]; status?: string }) => {
    const response = await api.post('/tour-programs', data);
    return response.data;
};

export const updateTourStatus = async (id: string, data: { status: 'Approved' | 'Rejected'; remarks: string }) => {
    const response = await api.patch(`/tour-programs/${id}/status`, data);
    return response.data;
};
