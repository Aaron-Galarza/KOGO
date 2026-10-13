'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { closeSocket } from '@/lib/socket-client';
import { ReactNode } from 'react';
import { Lock } from 'lucide-react';

function CredentialsScreen() {
  const router = useRouter();
  return (
    <div className="cart-bg min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full mx-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <Lock size={28} className="text-[#D9383A]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
          Acceso restringido
        </h1>
        <p className="text-[#757575] text-sm mb-6">
          No tienes las credenciales para visualizar el panel de administracion. Inicia sesion para continuar.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-[#D9383A] text-white py-3 rounded-lg font-bold hover:bg-[#b52d2f] transition"
        >
          Ir a iniciar sesion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token && pathname !== '/login') router.push('/login');
  }, [token, pathname, router]);

  useEffect(() => {
    return () => { closeSocket(); };
  }, []);

  if (pathname === '/login') return <>{children}</>;

  if (!mounted || !token) return <CredentialsScreen />;

  return <>{children}</>;
}