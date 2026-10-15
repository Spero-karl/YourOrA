import React, { useState } from 'react';
import { ShoppingBag, Star, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { getAssetUrl } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onSelectForCheckout: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectForCheckout,
  onQuickAddToCart,
  onOpenDetails
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleCardClick = () => {
    onOpenDetails(product);
  };

  const handleProceedCheckout = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectForCheckout(product);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl overflow-hidden hover:border-[#D5C6B3] hover:shadow-xs transition-all cursor-pointer"
    >
      {/* Product Image Slot - Compact Square Aspect Ratio */}
      <div className="relative aspect-square bg-[#F2EDE4] overflow-hidden">
        {!imageError ? (
          <img
            src={getAssetUrl(product.image)}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#F2EDE4] text-[#A89887]">
            <ShoppingBag className="w-6 h-6 mb-1 stroke-1" />
            <span className="text-[10px]">{product.name}</span>
          </div>
        )}

        {/* Subtle promo tag */}
        {product.isPromo && product.discountPercentage && (
          <div className="absolute top-2 left-2 bg-[#1C1917]/90 text-[#FAF7F2] text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase">
            -{product.discountPercentage}%
          </div>
        )}
      </div>

      {/* Product Information - Compact & Clean */}
      <div className="flex-1 p-2.5 sm:p-3.5 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#8C7A68]">
            <span className="uppercase font-medium tracking-wider truncate max-w-[90px] sm:max-w-none">
              {product.categorySlug === 'montres' ? 'Montre' : 'Parfum'}
            </span>
            <div className="flex items-center gap-0.5 text-[#44403C]">
              <Star className="w-2.5 h-2.5 fill-[#D4AF37] text-[#D4AF37]" />
              <span className="font-semibold tabular-nums">{product.rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif-luxury font-medium text-xs sm:text-sm text-[#1C1917] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price & Cart button directly below */}
        <div className="pt-2 border-t border-[#ECE3D5]/80 space-y-1.5">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="font-serif-luxury text-xs sm:text-sm font-bold text-[#1C1917] tabular-nums">
                {formatFCFA(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-[9px] line-through text-[#A89887] tabular-nums">
                  {formatFCFA(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Quick add '+' */}
            <button
              type="button"
              onClick={handleQuickAdd}
              title="Ajouter au panier"
              className="p-1 rounded-full border border-[#E3D7C7] bg-[#F5F0E8] hover:bg-[#EFE7DC] text-[#44403C] transition-colors"
            >
              {justAdded ? <Check className="w-3 h-3 text-[#E6C694]" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>

          {/* Cart Icon & Direct Checkout Button: redirects to payment page with details */}
          <button
            type="button"
            onClick={handleProceedCheckout}
            title="Acheter et voir les détails"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-xl text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all active:scale-95 shadow-2xs"
          >
            <ShoppingBag className="w-3 h-3 stroke-1.5 shrink-0" />
            <span>Commander</span>
          </button>
        </div>
      </div>
    </article>
  );
};
