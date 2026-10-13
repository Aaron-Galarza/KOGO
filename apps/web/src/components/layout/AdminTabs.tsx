'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LayoutDashboard, ShoppingCart, ChefHat, Package, DollarSign, Image, Settings, LogOut, Utensils } from 'lucide-react';

const allTabs = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/ventas', label: 'Estadisticas', Icon: DollarSign, ownerOnly: true },
  { href: '/admin/pedidos', label: 'Pedidos', Icon: Package },
  { href: '/admin/cocina', label: 'Cocina', Icon: ChefHat },
  { href: '/admin/pos', label: 'POS', Icon: ShoppingCart },
  { href: '/admin/productos', label: 'Menu', Icon: Utensils },
  { href: '/admin/galeria', label: 'Galeria', Icon: Image },
  { href: '/admin/config', label: 'Configuracion', Icon: Settings },
];

export function AdminTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.getRole());

  const handleLogout = () => { logout(); router.push('/login'); };

  const tabs = allTabs.filter((tab) => !tab.ownerOnly || role === 'owner');

  return (
    <div className="flex overflow-x-auto hide-scrollbar bg-white shadow-sm border-b border-gray-200">
        {tabs.map(({ href, label, Icon }) => (
          <Link key={href} href={href}
            className={`px-3 py-3 font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 text-xs sm:text-sm ${
              pathname === href ? 'border-[#D9383A] text-[#D9383A]' : 'border-transparent text-[#757575] hover:text-[#212121] hover:bg-gray-50'}`}>
            <Icon size={16} className="sm:size-[16px] size-[18px]" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
        <button onClick={handleLogout}
          className="ml-auto px-3 py-3 text-[#D9383A] hover:bg-red-50 font-semibold border-b-2 border-transparent transition flex items-center gap-1 text-xs sm:text-sm">
          <LogOut size={16} /> Salir
        </button>
      </div>
  );
}
