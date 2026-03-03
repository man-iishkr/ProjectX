import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitMonthlyAchievement, getFinancialYearProgress } from '../api/monthlyAchievement.api';

export const useFinancialYearProgress = (startYear?: number, hq?: string, employeeId?: string) => {
    return useQuery({
        queryKey: ['target-progress', startYear, hq, employeeId],
        queryFn: () => getFinancialYearProgress(startYear, hq, employeeId),
    });
};

export const useSubmitMonthlyAchievement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitMonthlyAchievement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['target-progress'] });
        }
    });
};
