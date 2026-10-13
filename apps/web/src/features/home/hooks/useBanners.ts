'use client';

import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import { Banner } from '@/types';

interface HeroSlide {
  title: string;
  text: string;
  image: string;
  cta: string;
  ctaHref: string;
}

export function useBanners() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menuService.getBanners()
      .then((banners: Banner[]) => {
        if (banners.length > 0) {
          const newSlides = banners.map((b) => ({
            title: b.title,
            text: b.description || '',
            image: b.image,
            cta: 'VER MAS',
            ctaHref: '/menu',
          }));
          setSlides(newSlides);
        } else {
          setSlides([]);
        }
      })
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  return { slides, loading };
}
