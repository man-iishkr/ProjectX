import api from './axios';

export const getDoctors = async (hqId?: string) => {
    const params = hqId ? { hq: hqId } : {};
    const { data } = await api.get('/doctors', { params });
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

export const batchApproveDoctors = async (doctorIds: string[]) => {
    const { data } = await api.put(`/doctors/batch-approve`, { doctorIds });
    return data;
};

export const captureDoctorLocation = async (id: string, formData: FormData) => {
    const { data } = await api.post(`/doctors/${id}/location`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return data;
};
