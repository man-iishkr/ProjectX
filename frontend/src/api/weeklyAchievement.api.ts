import api from './axios';

export const submitWeeklyAchievement = async (data: { year: number, month: number, week: number, salesAchieved: number }) => {
    const res = await api.post('/operations/targets/weekly-achievements', data);
    return res.data;
};

export const getMonthlyProgress = async (year?: number, month?: number, hq?: string) => {
    let url = '/operations/targets/progress';
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (hq) params.append('hq', hq);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const res = await api.get(url);
    return res.data;
};
