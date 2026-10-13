'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/useToast';
import { ReactNode } from 'react';

interface OwnerOnlyProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function OwnerOnly({ children, fallbackPath = '/admin' }: OwnerOnlyProps) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.getRole());
  const { showError } = useToast();

  useEffect(() => {
    if (role !== 'owner') {
      showError('Solo owner tiene permitido ver esta pantalla');
      router.push(fallbackPath);
    }
  }, [role, router, pathname, fallbackPath, showError]);

  if (role !== 'owner') {
    return null;
  }

  return <>{children}</>;
}