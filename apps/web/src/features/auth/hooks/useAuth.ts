'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginResponse } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { token, user } = await authService.login(email, password);
      login(token, user);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return { handleLogin, handleLogout, loading, error };
}
