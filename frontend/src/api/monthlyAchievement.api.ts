import api from './axios';

export const submitMonthlyAchievement = async (data: { year: number, month: number, salesAchieved: number }) => {
    const res = await api.post('/operations/targets/monthly-achievements', data);
    return res.data;
};

export const getFinancialYearProgress = async (startYear?: number, hq?: string, employeeId?: string) => {
    let url = '/operations/targets/progress';
    const params = new URLSearchParams();
    if (startYear) params.append('startYear', startYear.toString());
    if (hq) params.append('hq', hq);
    if (employeeId) params.append('employeeId', employeeId);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const res = await api.get(url);
    return res.data;
};
