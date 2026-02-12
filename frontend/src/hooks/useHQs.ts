import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useHQs = () => {
    return useQuery({
        queryKey: ['hqs'],
        queryFn: async () => {
            const res = await api.get('/hqs');
            return res.data.data;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};
