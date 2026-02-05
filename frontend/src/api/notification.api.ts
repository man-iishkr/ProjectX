import api from './axios';

export interface Notification {
    id: string;
    type: 'approval' | 'alert';
    message: string;
    link: string;
    count: number;
    details?: string[];
}

export const notificationAPI = {
    getNotifications: async (checkStock: boolean = false): Promise<Notification[]> => {
        const { data } = await api.get('/notifications', { params: { checkStock } });
        return data.data;
    }
};
