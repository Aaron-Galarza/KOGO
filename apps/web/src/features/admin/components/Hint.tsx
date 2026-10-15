'use client';

import { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

// Globito de ayuda: al pasar el cursor sobre el ícono muestra una explicación.
export function Hint({ children }: { children: ReactNode }) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <HelpCircle size={13} className="cursor-help text-[#B0B4B8] transition-colors group-hover:text-[#D95A2B]" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-[#212121] px-3 py-2 text-[10px] font-normal normal-case leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {children}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#212121]" />
      </span>
    </span>
  );
}
