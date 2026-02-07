import axios from './axios';

// Search Places via Backend Proxy
export const searchPlaces = async (query: string, locationBias?: string) => {
    if (!query || query.length < 3) return [];

    try {
        const params: any = { query };
        if (locationBias) {
            params.location = locationBias; // lat,lng
        }

        const res = await axios.get('/mappls/search', { params });

        if (res.data.success) {
            return res.data.data;
        }
        return [];
    } catch (error) {
        console.error('Mappls Search Error', error);
        return [];
    }
};

// Get Place Details by eLoc (for AutoSuggest selection)
export const getPlaceDetails = async (eLoc: string, address?: string) => {
    if (!eLoc && !address) return null;

    try {
        const res = await axios.get('/mappls/details', {
            params: { eloc: eLoc, address }
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

// Reverse Geocode (Lat, Lng -> Address)
export const getReverseGeoCode = async (lat: number, lng: number) => {
    try {
        const res = await axios.get('/mappls/details', {
            params: { lat, lng }
        });

        if (res.data.success) {
            return res.data.data;
        }
        return null;
    } catch (error) {
        console.error('Mappls RevGeo Error', error);
        return null;
    }
};

// Get Token (For Map SDK if needed)
export const getMapplsToken = async () => {
    try {
        const res = await axios.get('/mappls/token');
        if (res.data.success) return res.data.access_token;
        return null;
    } catch (error) {
        console.error('Mappls Token Error', error);
        return null;
    }
};
