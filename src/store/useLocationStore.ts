import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
    city: string | null;
    lat: number | null;
    lng: number | null;
    countryCode: string | null;
    permissionAsked: boolean;
    setLocation: (city: string | null, lat: number | null, lng: number | null) => void;
    setCountryCode: (code: string | null) => void;
    setPermissionAsked: (v: boolean) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            city: null,
            lat: null,
            lng: null,
            countryCode: null,
            permissionAsked: false,
            setLocation: (city, lat, lng) => set({ city, lat, lng }),
            setCountryCode: (countryCode) => set({ countryCode }),
            setPermissionAsked: (permissionAsked) => set({ permissionAsked }),
            clearLocation: () => set({ city: null, lat: null, lng: null }),
        }),
        {
            name: 'suqafuran-location',
        }
    )
);
