'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { menuService } from '@/services/menu.service';
import { Addon, Category } from '@/types';
import { CartItem } from '@/features/cart/components/CartItem';
import { formatCurrency } from '@/utils/format';
import { cloudinaryUrl } from '@/utils/imageUrl';

const FONDO_URL = cloudinaryUrl(
  'https://res.cloudinary.com/dwqxdensk/image/upload/v1785372509/fondo_r3yhjq.webp',
  1600
);

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateCartItemAddOns = useCartStore((s) => s.updateCartItemAddOns);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDiscount = useCartStore((s) => s.getDiscount);
  const deliveryCost = useCartStore((s) => s.deliveryCost);
  const getTotal = useCartStore((s) => s.getTotal);
  const itemCount = useCartStore((s) => s.getItemCount());

  const [fadeIn, setFadeIn] = useState(false);
  const [additionals, setAdditionals] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setFadeIn(true);
    Promise.all([menuService.getAdditionals(), menuService.getCategories()])
      .then(([a, c]) => { setAdditionals(a); setCategories(c); }).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="fixed inset-0 -z-10">
          <Image src={FONDO_URL} alt="" fill sizes="100vw" aria-hidden className="object-cover object-center" />
        </div>
        <div className="fixed inset-0 bg-white/70" />
        <div className="relative z-10 text-center">
          <h1 className="mb-2 font-[var(--font-montserrat)] text-3xl font-extrabold text-[#D9383A]">
            <ShoppingCart className="mr-2 inline-block h-8 w-8" />Tu carrito esta vacio
          </h1>
          <p className="mb-6 text-[#4a5568] font-[var(--font-open-sans)]">Agrega productos para comenzar</p>
          <Link href="/menu" className="inline-block rounded-xl bg-[#D9383A] px-8 py-3 font-bold text-white shadow-[0_5px_15px_rgba(217,56,58,0.3)] transition-all duration-200 hover:-translate-y-[3px] hover:bg-[#b52d2f]">Ver menu</Link>
        </div>
      </div>
    );
  }

  return (
      <div className="relative min-h-screen pb-40">
      <div className="fixed inset-0 -z-10">
        <Image src={FONDO_URL} alt="" fill sizes="100vw" aria-hidden className="object-cover object-center" />
      </div>
      <div className="fixed inset-0 bg-white/70" />
      <div className="relative z-10 mx-auto mb-10 mt-10 max-w-[700px] rounded-2xl bg-white/80 p-6 shadow-sm max-md:mt-4 max-md:mx-4 max-md:p-4"
        style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s ease-out, transform 0.5s ease-out' }}>
        <h1 className="mb-8 text-center font-[var(--font-montserrat)] text-[2.5rem] font-extrabold uppercase tracking-[0.05em] text-[#D9383A] max-md:text-[2rem]">
          Tu Carrito
        </h1>
        <div className="space-y-4">
          {items.map((item) => (
            <CartItem key={item.cartItemId} item={item} allAdditionals={additionals} allCategories={categories}
              onIncrement={(addOns) => addToCart(item, addOns)}
              onDecrement={removeFromCart}
              onUpdateAddOns={updateCartItemAddOns}
              onRemove={(cartItemId) => {
                // Remove all units of this item
                const target = items.find((i) => i.cartItemId === cartItemId);
                if (target) {
                  for (let i = 0; i < target.quantity; i++) removeFromCart(cartItemId);
                }
              }}
            />
          ))}
        </div>
        <div className="mt-8 border-t-2 border-dashed border-[#e0e0e0] pt-6">
          <div className="flex items-center justify-end gap-3 max-md:justify-center">
            <span className="text-[2rem] font-extrabold text-[#212121] font-[var(--font-montserrat)] max-md:text-[1.6rem]">
              Total: {formatCurrency(getTotal())}
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4 max-md:flex-col max-md:gap-3">
          <button onClick={clearCart} className="rounded-xl bg-[#90A4AE] px-6 py-3 text-center text-sm font-bold uppercase text-white transition-all duration-200 hover:-translate-y-[2px] hover:bg-[#78909C]">Vaciar Carrito</button>
          <Link href="/checkout" className="block rounded-xl bg-[#D9383A] px-7 py-3.5 text-center text-sm font-bold uppercase tracking-[0.05em] text-white shadow-[0_5px_15px_rgba(217,56,58,0.3)] transition-all duration-200 hover:-translate-y-[3px] hover:bg-[#b52d2f]">Confirmar Pedido</Link>
        </div>
      </div>
    </div>
  );
}
