'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsappIcon } from '@/components/ui/icons';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin/cocina') || pathname.startsWith('/admin/pos')) return null;
  return (
    <footer className="bg-[#1a1a1a] text-gray-200 py-6 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-6 md:gap-4">

        {/* Columna Izquierda: Redes Sociales */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h3 className="text-[#ff8c00] font-bold text-base">Redes Sociales</h3>
          <div className="flex gap-4 text-gray-100">
            <a href="https://www.facebook.com/CheepersTBH" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff8c00] transition-colors" aria-label="Facebook">
              <FacebookIcon size={20} />
            </a>
            <a href="https://www.instagram.com/cheeperstbh" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff8c00] transition-colors" aria-label="Instagram">
              <InstagramIcon size={20} />
            </a>
            <a href="https://wa.me/543624063011" target="_blank" rel="noopener noreferrer" className="hover:text-[#ff8c00] transition-colors" aria-label="WhatsApp">
              <WhatsappIcon size={20} />
            </a>
          </div>
          <span className="text-sm font-medium tracking-wide">+54 3624063011</span>
        </div>

        {/* Columna Central: Derechos Reservados */}
        <div className="flex flex-col items-center text-center gap-0.5 text-sm text-gray-400 md:mt-8">
          <p>Todos los derechos reservados.</p>
          <p>© 2025 Cheepers TBH</p>
        </div>

        {/* Columna Derecha: Acerca de la Plataforma */}
        <div className="flex flex-col items-center md:items-end gap-0.5 text-sm text-center md:text-right">
          <h3 className="text-[#ff8c00] font-bold text-base">Acerca de la Plataforma</h3>
          <p className="text-gray-300">Desarrollada por AFdevelopers:</p>
          <p className="text-gray-300">Contacto:</p>
          <p className="font-medium tracking-wide">+54 3624250501</p>
          <a href="https://www.afdevelopers.com/" className="flex items-center gap-2 mt-1 hover:text-[#ff8c00] transition-colors">
            <span>Toca acá y pedinos tu sistema</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
