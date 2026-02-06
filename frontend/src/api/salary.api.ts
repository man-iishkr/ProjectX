import api from './axios';

export const getSalaries = async (filters: any) => {
    const query = new URLSearchParams(filters).toString();
    const response = await api.get(`/salary?${query}`);
    return response.data;
};

export const getSalaryById = async (id: string) => {
    const response = await api.get(`/salary/${id}`);
    return response.data;
};

// This functions as "Generate Salary" too
export const upsertSalary = async (data: any) => {
    const response = await api.post('/salary', data);
    return response.data;
};

export const updatePaymentStatus = async (id: string, data: any) => {
    const response = await api.put(`/salary/${id}/payment`, data);
    return response.data;
};

export const getSalaryStats = async (period: { year: number, month: number }) => {
    const response = await api.get(`/salary/stats?year=${period.year}&month=${period.month}`);
    return response.data;
};

export const deleteSalary = async (id: string) => {
    const response = await api.delete(`/salary/${id}`);
    return response.data;
};
