import { HeroSection } from '@/features/home/components/HeroSection';
import { AboutSection } from '@/components/blocks/about-section';
import { CTASection } from '@/components/blocks/cta-section';
import { StoreStatus } from '@/features/menu/components/StoreClosed';
import { menuService } from '@/services/menu.service';
import { Banner, StoreConfig } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [banners, config] = await Promise.all([
    menuService.getBanners().catch(() => [] as Banner[]),
    menuService.getStoreStatus().catch(() => null as unknown as StoreConfig),
  ]);

  const slides = banners.map((b) => ({
    title: b.title,
    text: b.description || '',
    image: b.image,
    cta: 'VER MAS',
    ctaHref: '/menu',
  }));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 pt-2 pb-1">
        <StoreStatus config={config} />
      </div>
      <HeroSection slides={slides} />
      <AboutSection />
      <CTASection />
    </div>
  );
}
