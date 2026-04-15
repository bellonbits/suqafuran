/**
 * Zustand persist storage adapter.
 *
 * On iOS / Android (Capacitor native) → uses @capacitor/preferences
 *   which maps to NSUserDefaults (iOS) / SharedPreferences (Android).
 *   This survives low-memory kills, app restarts, and OS-level cache clears.
 *
 * On web → falls back to localStorage (normal browser behaviour).
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

const isNative = Capacitor.isNativePlatform();

export const nativeStorage: StateStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (isNative) {
            const { value } = await Preferences.get({ key });
            return value;
        }
        return localStorage.getItem(key);
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (isNative) {
            await Preferences.set({ key, value });
        } else {
            localStorage.setItem(key, value);
        }
    },

    removeItem: async (key: string): Promise<void> => {
        if (isNative) {
            await Preferences.remove({ key });
        } else {
            localStorage.removeItem(key);
        }
    },
};
