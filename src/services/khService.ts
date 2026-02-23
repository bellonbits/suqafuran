import api from './api';

export interface KHPin {
    id: number;
    code: string;
    latitude: number;
    longitude: number;
    landmark_id?: number;
    place_id: number;
    owner_id?: number;
    privacy_level: 'public' | 'private';
}

export interface KHPinDetails {
    code: string;
    latitude: number;
    longitude: number;
    landmark_name?: string;
    place_name: string;
    district_name?: string;
    city_name?: string;
}

export interface NearbyLandmark {
    id: number;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
    distance: number;
}

export const khService = {
    createPin: async (data: { latitude: number; longitude: number; landmark_id?: number; place_id: number; privacy_level?: string }) => {
        const response = await api.post<KHPin>('/kh/pin', data);
        return response.data;
    },

    getPinDetails: async (code: string) => {
        const response = await api.get<KHPinDetails>(`/kh/pin/${code}`);
        return response.data;
    },

    search: async (q: string) => {
        const response = await api.get<{ pins: KHPin[]; landmarks: any[]; places: any[] }>(`/kh/search?q=${q}`);
        return response.data;
    },

    getNearbyLandmarks: async (lat: number, lng: number, radius?: number) => {
        const response = await api.get<NearbyLandmark[]>(`/kh/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}`);
        return response.data;
    },

    getEmergencyContacts: async (districtId?: number) => {
        const response = await api.get<any[]>(`/kh/emergency${districtId ? `?district_id=${districtId}` : ''}`);
        return response.data;
    }
};
