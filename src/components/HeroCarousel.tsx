import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { getAssetUrl } from '../utils/imageUtils';

interface HeroCarouselProps {
  onSelectProductForCheckout: (product: Product) => void;
  products: Product[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onSelectProductForCheckout,
  products
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Dynamic slides selected by Admin or marked as featured/promo
  const heroProducts = useMemo(() => {
    const featured = products.filter((p) => p.isFeaturedInHero);
    if (featured.length > 0) return featured;
    const promo = products.filter((p) => p.isPromo);
    if (promo.length > 0) return promo;
    return products.slice(0, 3);
  }, [products]);

  const totalSlides = heroProducts.length;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  if (totalSlides === 0) return null;

  // Make sure index is within bounds
  const safeIndex = currentIndex >= totalSlides ? 0 : currentIndex;
  const currentProduct = heroProducts[safeIndex];

  return (
    <section
      className="relative max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-1 pb-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Bannière d'articles phares"
    >
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#141210] text-[#FAF7F2] h-[190px] sm:h-[250px] md:h-[290px] border border-[#2E2823] shadow-xs">
        
        {/* Background Images */}
        {heroProducts.map((prod, idx) => (
          <div
            key={prod.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === safeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={getAssetUrl(prod.image)}
              alt={prod.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/90 via-[#141210]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141210]/85 via-[#141210]/40 to-transparent" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-20 h-full flex flex-col justify-end p-3.5 sm:p-6 md:p-8 max-w-xl">
          <div className="space-y-1.5 sm:space-y-2.5">
            
            {/* Badge & Category */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[#E6C694] uppercase text-[9px] sm:text-[10px] font-semibold tracking-wider bg-[#1C1917]/80 px-2 py-0.5 rounded-full border border-[#E6C694]/30">
                <Tag className="w-2.5 h-2.5" />
                {currentProduct.promoBadgeText || (currentProduct.isPromo ? `-${currentProduct.discountPercentage || 15}%` : 'Pièce Phare')}
              </span>
              <span className="uppercase tracking-wider text-[9px] sm:text-[10px] text-[#D4C3B2] font-medium">
                {currentProduct.category}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-serif-luxury text-base sm:text-2xl md:text-3xl font-medium tracking-tight text-[#FAF7F2] leading-tight line-clamp-1">
              {currentProduct.name}
            </h2>

            {/* Price & CTA */}
            <div className="pt-1 flex items-center gap-3 sm:gap-5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-serif-luxury text-base sm:text-xl font-bold tabular-nums text-white">
                  {formatFCFA(currentProduct.price)}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-xs line-through text-[#8C7A68] tabular-nums">
                    {formatFCFA(currentProduct.originalPrice)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectProductForCheckout(currentProduct)}
                className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#FAF7F2] text-[#1C1917] hover:bg-white rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-xs"
              >
                <span>Commander</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {totalSlides > 1 && (
          <div className="absolute right-2.5 bottom-2.5 sm:right-6 sm:bottom-6 z-30 flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Précédent"
              className="p-1.5 sm:p-2 rounded-full bg-[#1C1917]/70 hover:bg-[#2A2623] text-[#FAF7F2] border border-white/10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Suivant"
              className="p-1.5 sm:p-2 rounded-full bg-[#1C1917]/70 hover:bg-[#2A2623] text-[#FAF7F2] border border-white/10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Indicator Dots */}
        {totalSlides > 1 && (
          <div className="absolute left-3.5 bottom-2 sm:left-6 sm:bottom-3 z-30 flex items-center gap-1.5">
            {heroProducts.map((prod, idx) => (
              <button
                key={prod.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === safeIndex ? 'w-5 bg-[#E6C694]' : 'w-1.5 bg-white/30'
                }`}
                aria-label={`Article ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
