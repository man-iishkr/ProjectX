import api from './axios';

export const getEmployees = async () => {
    const { data } = await api.get('/employees');
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
