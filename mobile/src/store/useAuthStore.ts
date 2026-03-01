import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  initialize: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
      set({ token, isAuthenticated: true });
    } else {
      await AsyncStorage.removeItem('auth_token');
      set({ token: null, isAuthenticated: false });
    }
  },
  initialize: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ token: null, isAuthenticated: false });
  },
}));
