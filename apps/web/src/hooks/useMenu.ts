import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import { Product, Category } from '@/types';

function getCategoryName(cat: unknown): string {
  if (typeof cat === 'string') return cat;
  if (cat && typeof cat === 'object' && 'name' in cat) return (cat as { name: string }).name;
  return '';
}

export function useMenu(initial?: { products: Product[]; categories: Category[] }) {
  const [products, setProducts] = useState<Product[]>(initial?.products ?? []);
  const [categories, setCategories] = useState<Category[]>(initial?.categories ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initial) return;
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const [data, cats] = await Promise.all([
          menuService.getProducts(),
          menuService.getCategories(),
        ]);
        setProducts(data);
        setCategories(cats);
        setError(null);
      } catch (err) {
        setError('No pudimos cargar el menu. Intenta mas tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [initial]);

  const filtered = products.filter((product) => {
    const categoryName = getCategoryName(product.category);
    const matchesCategory = !selectedCategory || categoryName === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      (product.title || product.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

    return matchesCategory && matchesSearch;
  });

  const filteredProducts = [...filtered].sort((a, b) => Number(a.price) - Number(b.price));

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSetSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setSelectedCategory(null);
    }
  };

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    loading,
    error,
    selectedCategory,
    searchQuery,
    selectCategory: handleSelectCategory,
    setSearch: handleSetSearch,
  };
}
