import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitWeeklyAchievement, getMonthlyProgress } from '../api/weeklyAchievement.api';

export const useMonthlyProgress = (year?: number, month?: number, hq?: string) => {
    return useQuery({
        queryKey: ['target-progress', year, month, hq],
        queryFn: () => getMonthlyProgress(year, month, hq),
    });
};

export const useSubmitWeeklyAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitWeeklyAchievement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['target-progress'] });
        }
    });
};
