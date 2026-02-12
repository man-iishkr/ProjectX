import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/inventory/products');
            return res.data.data;
        },
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};
