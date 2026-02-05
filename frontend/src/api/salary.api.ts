import api from './axios';

export interface Salary {
    _id: string;
    employee: {
        _id: string;
        name: string;
        email: string;
        employeeId: string;
        designation?: string;
        bankDetails?: {
            accountNumber?: string;
        };
    };
    period: {
        year: number;
        month: number;
    };
    baseSalary: number;
    allowances: {
        hra: number;
        ta: number;
        da: number;
        medical: number;
        others: number;
    };
    deductions: {
        pf: number;
        tax: number;
        insurance: number;
        loanRepayment: number;
        others: number;
    };
    bonuses: {
        performance: number;
        festive: number;
        others: number;
    };
    workingDays: {
        total: number;
        present: number;
        absent: number;
        leaves: number;
        holidays: number;
    };
    paymentStatus: 'pending' | 'processed' | 'paid' | 'hold';
    paymentDate?: string;
    paymentMethod?: 'bank_transfer' | 'cash' | 'cheque';
    transactionId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    totalAllowances?: number;
    totalDeductions?: number;
    totalBonuses?: number;
    grossSalary?: number;
    netSalary?: number;
}

export interface SalaryStats {
    totalEmployees: number;
    totalPayroll: number;
    averageSalary: number;
    paymentStatus: {
        pending: number;
        processed: number;
        paid: number;
        hold: number;
    };
    totalDeductions: number;
    totalBonuses: number;
}

export const salaryAPI = {
    getAll: async (params?: {
        employeeId?: string;
        year?: number;
        month?: number;
        status?: string;
    }): Promise<Salary[]> => {
        const { data } = await api.get('/salary', { params });
        return data;
    },

    getById: async (id: string): Promise<Salary> => {
        const { data } = await api.get(`/salary/${id}`);
        return data;
    },

    upsert: async (salaryData: Partial<Salary>) => {
        const { data } = await api.post('/salary', salaryData);
        return data;
    },

    updatePaymentStatus: async (
        id: string,
        paymentData: {
            status: string;
            paymentDate?: string;
            paymentMethod?: string;
            transactionId?: string;
        }
    ) => {
        const { data } = await api.patch(`/salary/${id}/payment`, paymentData);
        return data;
    },

    generateSlip: async (id: string) => {
        const { data } = await api.get(`/salary/${id}/slip`);
        return data;
    },

    getStats: async (params?: { year?: number; month?: number }): Promise<SalaryStats> => {
        const { data } = await api.get('/salary/stats', { params });
        return data;
    },

    delete: async (id: string) => {
        const { data } = await api.delete(`/salary/${id}`);
        return data;
    }
};
