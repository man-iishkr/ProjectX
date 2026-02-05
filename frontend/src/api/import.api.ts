import api from './axios';

export const importAPI = {
    uploadExcel: async (formData: FormData) => {
        const { data } = await api.post('/admin/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    }
};
