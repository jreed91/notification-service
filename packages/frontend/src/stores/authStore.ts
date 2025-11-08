import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  apiKey: string | null;
  setApiKey: (apiKey: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      setApiKey: (apiKey: string) => {
        localStorage.setItem('apiKey', apiKey);
        set({ apiKey });
      },
      logout: () => {
        localStorage.removeItem('apiKey');
        set({ apiKey: null });
      },
      isAuthenticated: () => !!get().apiKey,
    }),
    {
      name: 'auth-storage',
    }
  )
);
