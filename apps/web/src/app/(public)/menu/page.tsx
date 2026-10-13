import { MenuClient } from '@/features/menu/components/MenuClient';
import { menuService } from '@/services/menu.service';
import { Product, Category } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [products, categories] = await Promise.all([
    menuService.getProducts().catch(() => [] as Product[]),
    menuService.getCategories().catch(() => [] as Category[]),
  ]);

  return <MenuClient initialProducts={products} initialCategories={categories} />;
}
