'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { cloudinaryUrl } from '@/utils/imageUrl';

interface HeroSlide {
  title: string;
  text: string;
  image: string;
  cta: string;
  ctaHref: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const totalSlides = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((index + totalSlides) % totalSlides);
      setTimeout(() => setIsTransitioning(false), 900);
    },
    [isTransitioning, totalSlides]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(goNext, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 75) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  return (
    <section
      className="relative mx-auto mt-4 mb-20 flex min-h-[500px] w-full max-w-[1200px] items-center justify-center overflow-hidden rounded-[70px] bg-[#FFF8E1] shadow-[0_5px_20px_rgba(0,0,0,0.08)] max-md:mt-8 max-md:mb-12 max-md:min-h-[480px] max-md:rounded-[30px] max-md:pb-24 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            'absolute inset-0 flex items-center justify-around px-[43px] max-md:flex-col max-md:justify-center max-md:gap-3 max-md:px-4',
            index === current
              ? 'pointer-events-auto z-[1] opacity-100'
              : 'pointer-events-none invisible opacity-0',
            'transition-[opacity] duration-[900ms] ease-[ease-in-out]'
          )}
        >
          <div className="relative h-[350px] w-full max-w-[550px] max-md:h-[220px] max-md:w-[95%] max-md:max-w-none">
            <Image
              src={cloudinaryUrl(slide.image, 1000)}
              alt={slide.title}
              fill
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 640px) 90vw, 550px"
              className="rounded-2xl object-cover shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div className="flex max-w-[500px] flex-col items-start max-md:items-center max-md:text-center">
            <h2 className="font-['Oswald'] text-4xl sm:text-5xl md:text-[4rem] font-bold uppercase leading-[1.1] tracking-wide text-[#e53e3e] max-md:text-3xl line-clamp-3">
              {slide.title}
            </h2>
            <p className="font-['Open_Sans'] text-lg sm:text-xl text-[#2d3748] max-md:text-base line-clamp-3">
              {slide.text}
            </p>
            <a
              href={slide.ctaHref}
              className="mt-6 inline-block rounded-full border-2 border-[#c53030] bg-transparent px-8 py-3 font-['Oswald'] text-[1.3em] font-semibold uppercase tracking-wider text-[#c53030] transition-all duration-300 ease-in-out hover:-translate-y-[2px] hover:bg-[#c53030] hover:text-white max-md:px-6 max-md:py-2 max-md:text-base"
            >
              {slide.cta}
            </a>
          </div>
        </div>
      ))}

      <button
        onClick={goPrev}
        className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#c53030] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors hover:bg-white max-md:hidden"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#c53030] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-colors hover:bg-white max-md:hidden"
        aria-label="Slide siguiente"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 md:bottom-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className="flex h-8 w-8 items-center justify-center md:h-12 md:w-12"
            aria-label={`Ir al slide ${index + 1}`}
          >
            <span
              className={cn(
                'block rounded-full transition-all duration-300',
                index === current
                  ? 'h-2 w-2 scale-125 bg-[#e53e3e] shadow-[0_0_0_4px_rgba(229,62,62,0.2)] md:h-3 md:w-3'
                  : 'h-2 w-2 bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.5)] md:h-3 md:w-3'
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
