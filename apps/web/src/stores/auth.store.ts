import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cheepers-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cheepers-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
};

export interface User {
  _id: string;
  email: string;
  role: 'owner' | 'admin';
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  getToken: () => string | null;
  getUser: () => User | null;
  getRole: () => 'owner' | 'admin' | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: getStoredToken(),
      user: getStoredUser(),

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      getToken: () => get().token,
      getUser: () => get().user,
      getRole: () => get().user?.role || null,
    }),
    {
      name: 'cheepers-auth',
      skipHydration: true,
    }
  )
);
