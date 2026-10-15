import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { getAssetUrl } from '../utils/imageUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const totalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#141210]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <aside className="w-screen max-w-md bg-[#FAF7F2] border-l border-[#ECE3D5] shadow-2xl flex flex-col justify-between">
          
          {/* Header: Simply "Mon panier" */}
          <div className="p-4 sm:p-5 border-b border-[#ECE3D5] bg-[#FCFAF7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#1C1917]" />
              <h3 className="font-serif-luxury font-medium text-base text-[#1C1917]">
                Mon panier
              </h3>
              <span className="text-xs text-[#8C7A68] font-mono">
                ({totalCount})
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#8C7A68] hover:bg-[#F3ECE1] rounded-full transition-colors"
              aria-label="Fermer le panier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                <ShoppingBag className="w-9 h-9 text-[#C5BAAD] stroke-1" />
                <p className="text-xs text-[#78716C] font-medium">Votre panier est vide.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 bg-[#FCFAF7] border border-[#ECE3D5] p-3 rounded-2xl"
                  >
                    <img
                      src={getAssetUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl border border-[#E3D7C7] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase font-semibold text-[#8C7A68]">
                        {item.product.categorySlug === 'montres' ? 'Montre' : 'Parfum'}
                      </p>
                      <h4 className="text-xs font-semibold text-[#1C1917] truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs font-bold text-[#1C1917] tabular-nums mt-0.5">
                        {formatFCFA(item.product.price)}
                      </p>

                      <div className="flex items-center gap-2.5 mt-1.5">
                        <div className="flex items-center border border-[#D9CDBF] rounded-full overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-[#F3ECE1] text-[#57534E]"
                            aria-label="Diminuer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-medium tabular-nums text-[#1C1917]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-[#F3ECE1] text-[#57534E]"
                            aria-label="Augmenter"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[#A89887] hover:text-[#9E4A4A] p-1"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-[#ECE3D5] bg-[#FCFAF7] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#78716C]">
                  <span>Sous-total</span>
                  <span className="font-semibold text-[#1C1917] tabular-nums">{formatFCFA(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#78716C]">
                  <span>Livraison</span>
                  <span className="text-[#8C7A68] font-medium">Offerte</span>
                </div>
                <div className="border-t border-[#ECE3D5] pt-1.5 flex justify-between text-sm font-bold text-[#1C1917]">
                  <span>Total</span>
                  <span className="tabular-nums text-base">{formatFCFA(subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-2.5 px-4 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <span>Commander</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
