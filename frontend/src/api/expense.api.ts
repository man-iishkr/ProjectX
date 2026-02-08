import api from './axios';

export const getExpenses = async () => {
    const { data } = await api.get('/expenses');
    return data;
};

export const createExpense = async (data: FormData) => {
    const { data: res } = await api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res;
};

export const updateExpenseStatus = async (id: string, status: string, amount?: number) => {
    const { data } = await api.put(`/expenses/${id}`, { status, amount });
    return data;
};
