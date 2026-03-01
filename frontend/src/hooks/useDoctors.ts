import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useDoctors = (hqId?: string) => {
    return useQuery({
        queryKey: ['doctors', hqId],
        queryFn: async () => {
            const params = hqId ? { hq: hqId } : {};
            const res = await api.get('/doctors', { params });
            return res.data.data; // Assuming api returns { success: true, count: n, data: [...] }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCreateDoctor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (doctorData: any) => {
            const res = await api.post('/doctors', doctorData);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
    });
};

export const useUpdateDoctor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/doctors/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
    });
};

export const useDeleteDoctor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/doctors/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
    });
};

export const useBatchApproveDoctors = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (doctorIds: string[]) => {
            const res = await api.put(`/doctors/batch-approve`, { doctorIds });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
    });
};
