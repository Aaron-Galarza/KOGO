'use client';

import { usePathname } from 'next/navigation';
import { AdminTabs } from '@/components/layout/AdminTabs';
import { ReactNode } from 'react';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCocina = pathname?.startsWith('/admin/cocina');
  const isPOS = pathname?.startsWith('/admin/pos');

  return (
    <div className={(isCocina || isPOS) ? '-mt-[70px] md:-mt-[100px]' : ''}>
      <div className={`sticky z-40 ${(isCocina || isPOS) ? 'top-0' : 'top-[70px] md:top-[100px]'}`}>
        <AdminTabs />
      </div>
      {children}
    </div>
  );
}
