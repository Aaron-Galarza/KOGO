'use client';

import { HeroCarousel } from '@/components/blocks/hero-carousel';

interface HeroSlide {
  title: string;
  text: string;
  image: string;
  cta: string;
  ctaHref: string;
}

export function HeroSection({ slides }: { slides: HeroSlide[] }) {
  if (slides.length === 0) return null;
  return <HeroCarousel slides={slides} />;
}
