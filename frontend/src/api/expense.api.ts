import api from './axios';

export const getExpenses = async () => {
    const { data } = await api.get('/expenses');
    return data;
};

export const updateExpenseStatus = async (id: string, status: string, amount?: number) => {
    const { data } = await api.put(`/expenses/${id}`, { status, amount });
    return data;
};
