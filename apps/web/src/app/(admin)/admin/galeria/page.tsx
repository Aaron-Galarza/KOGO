'use client';

import { Image } from 'lucide-react';
import { GalleryManager } from '@/features/admin/galeria/components/GalleryManager';

export default function GaleriaPage() {
  return (
    <div className="cart-bg min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2">
          <Image size={22} /> Galeria
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4">Imagenes publicadas en la galeria del sitio.</p>
        <GalleryManager />
      </div>
    </div>
  );
}
