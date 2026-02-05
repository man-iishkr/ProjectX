import api from './axios';

export const getDoctors = async () => {
    const { data } = await api.get('/doctors');
    return data;
};

export const createDoctor = async (doctorData: any) => {
    const { data } = await api.post('/doctors', doctorData);
    return data;
};

export const updateDoctor = async (id: string, doctorData: any) => {
    const { data } = await api.put(`/doctors/${id}`, doctorData);
    return data;
};

export const deleteDoctor = async (id: string) => {
    const { data } = await api.delete(`/doctors/${id}`);
    return data;
};
