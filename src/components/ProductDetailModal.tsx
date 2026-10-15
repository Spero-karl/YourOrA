import React, { useState } from 'react';
import { X, Star, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { formatFCFA } from '../utils/formatCurrency';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectForCheckout: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectForCheckout,
  onAddToCart
}) => {
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#141210]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#FCFAF7] text-left shadow-2xl transition-all w-full max-w-3xl border border-[#ECE3D5]">
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-[#F3ECE1] text-[#78716C] transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image section */}
            <div className="relative aspect-square md:aspect-auto bg-[#F2EDE4]">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              {product.isPromo && (
                <div className="absolute top-4 left-4 bg-[#1C1917]/90 text-[#FAF7F2] text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-widest uppercase backdrop-blur-xs">
                  {product.promoBadgeText || `-${product.discountPercentage}%`}
                </div>
              )}
            </div>

            {/* Content section */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#8C7A68]">
                    <span className="uppercase tracking-[0.25em] font-medium text-[10px]">{product.category}</span>
                    <div className="flex items-center gap-1 text-[#44403C]">
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="font-semibold text-xs tabular-nums">{product.rating}</span>
                      <span className="text-[#A89887] text-[10px]">({product.reviewsCount})</span>
                    </div>
                  </div>
                  <h2 className="font-serif-luxury text-xl sm:text-2xl font-normal text-[#1C1917] tracking-tight leading-snug">
                    {product.name}
                  </h2>
                </div>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-serif-luxury font-medium text-[#1C1917] tabular-nums">
                    {formatFCFA(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs sm:text-sm line-through text-[#A89887] tabular-nums font-light">
                      {formatFCFA(product.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#78716C] leading-relaxed font-light">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectForCheckout(product);
                  }}
                  className="w-full py-3 px-4 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full text-xs font-medium uppercase tracking-widest transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Acheter maintenant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full py-2.5 px-4 border rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    added
                      ? 'border-[#1C1917] bg-[#1C1917] text-[#FAF7F2]'
                      : 'border-[#D9CDBF] hover:bg-[#F3ECE1] text-[#44403C]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#E6C694]" />
                      <span>Ajouté à votre sélection</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter au panier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
