import api from './axios';

export const getEmployees = async (hqId?: string, status: 'active' | 'past' | 'all' = 'active') => {
    const params: any = { status };
    if (hqId) params.hq = hqId;

    const { data } = await api.get('/employees', { params });
    return data;
};

export const createEmployee = async (employeeData: any) => {
    const { data } = await api.post('/employees', employeeData);
    return data;
};

export const deleteEmployee = async (id: string) => {
    const { data } = await api.delete(`/employees/${id}`);
    return data;
};

export const updateEmployee = async (id: string, employeeData: any) => {
    const { data } = await api.put(`/employees/${id}`, employeeData);
    return data;
};
