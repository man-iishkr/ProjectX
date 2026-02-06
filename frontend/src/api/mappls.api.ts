import axios from './axios';

// Search Places via Backend Proxy
export const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) return [];

    try {
        const res = await axios.get('/mappls/search', {
            params: { query }
        });

        if (res.data.success) {
            return res.data.data;
        }
        return [];
    } catch (error) {
        console.error('Mappls Search Error', error);
        return [];
    }
};

// Get Place Details via Backend Proxy
export const getPlaceDetails = async (eLoc: string) => {
    if (!eLoc) return null;

    try {
        const res = await axios.get('/mappls/details', {
            params: { eloc: eLoc }
        });

        if (res.data.success) {
            return res.data.data;
        }
        return null;
    } catch (error) {
        console.error('Mappls Place Detail Error', error);
        return null;
    }
};
