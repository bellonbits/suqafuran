import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
    city: string | null;
    lat: number | null;
    lng: number | null;
    permissionAsked: boolean;
    setLocation: (city: string | null, lat: number | null, lng: number | null) => void;
    setPermissionAsked: (v: boolean) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            city: null,
            lat: null,
            lng: null,
            permissionAsked: false,
            setLocation: (city, lat, lng) => set({ city, lat, lng }),
            setPermissionAsked: (permissionAsked) => set({ permissionAsked }),
            clearLocation: () => set({ city: null, lat: null, lng: null }),
        }),
        {
            name: 'suqafuran-location',
        }
    )
);
