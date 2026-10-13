"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => { setMounted(true); }, []);

  if (pathname.startsWith('/admin/cocina') || pathname.startsWith('/admin/pos')) return null;

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Menú", href: "/menu" },
  ];

  return (
    <header className="fixed top-0 left-0 z-[1000] flex w-full flex-wrap items-center justify-between bg-white px-[3%] py-[16px] shadow-[0_1px_6px_rgba(0,0,0,0.1)] md:px-[5%] md:py-[15px]">
      
      {/* Logo + Texto */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center no-underline">
          <div className="mr-2 md:mr-[12px]">
            <img
              src="https://res.cloudinary.com/dwqxdensk/image/upload/q_auto,f_auto,w_140/v1784748985/logocheepers_u8y9am.webp"
              alt="Cheepers Logo"
              className="h-[40px] w-[40px] md:h-[70px] md:w-[70px] object-contain" loading="lazy"
            />
          </div>
          <span className="text-[1.8rem] font-bold text-[#2d3748] md:text-[2.2rem]">
            CHEEPERS
          </span>
        </Link>
      </div>

      {/* Navegación Desktop */}
      {/* Los márgenes derechos y gaps replican exactamente tus media queries del CSS viejo (<1000px, <1200px, etc.) */}
      <nav className="hidden items-center gap-[15px] md:mr-[35px] md:flex lg:mr-[45px] lg:gap-[20px] xl:mr-[60px] xl:gap-[25px]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-[1.2rem] transition-colors duration-200 ${
                isActive
                  ? "font-bold text-[#e53e3e]"
                  : "font-medium text-[#2d3748] hover:font-bold hover:text-[#e53e3e]"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Acciones (Carrito, Usuario, Toggle Móvil) */}
      <div className="ml-auto flex items-center gap-[16px] md:ml-0 md:gap-[15px]">
        
        {/* Botón Carrito */}
        <Link
          href="/cart"
          aria-label="Ver carrito"
          className="group relative flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#e53e3e] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#e41212] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)]"
        >
          <ShoppingCart size={20} className="text-white transition-colors duration-300 group-hover:text-white" />
          
          {/* Badge del carrito */}
          {mounted && cartCount > 0 && (
            <span className="absolute -right-[6px] -top-[6px] rounded-full border-2 border-[#e53e3e] bg-white px-[6px] py-[2px] text-[0.7rem] font-bold text-[#e53e3e]">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Botón Usuario (Oculto en móvil según tu clase .user-button-desktop) */}
        <Link
          href="/login"
          aria-label="Ingresar"
          className="group hidden h-[40px] w-[40px] items-center justify-center rounded-full bg-[#e53e3e] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-[2px] hover:bg-[#e41212] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] md:flex"
        >
          <User size={20} className="text-white transition-colors duration-300 group-hover:text-white" />
        </Link>

        {/* Toggle Menú Móvil */}
        <button
          className="block cursor-pointer border-none bg-transparent p-0 text-[#e53e3e] md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Alternar menú"
        >
          {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* Navegación Móvil */}
      {isMobileMenuOpen && (
        <nav className="absolute left-0 top-[70px] z-[999] flex w-full flex-col items-center gap-[15px] rounded-b-[16px] bg-white p-[24px] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`w-full border-b border-[#edf2f7] py-[16px] text-center text-[1.2rem] last:border-b-0 ${
                  isActive
                    ? "font-bold text-[#e53e3e]"
                    : "font-medium text-[#2d3748]"
                }`}
                onClick={() => setIsMobileMenuOpen(false)} // Cierra el menú al navegar
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
