import React, { useState } from 'react';
import { User, Search, ShoppingBag, X, LogIn, LogOut, Shield, Smartphone, Truck } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenDelivery?: () => void;
  onLogout: () => void;
  onOpenCart: () => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userProfile: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenAuth,
  onOpenAdmin,
  onOpenDelivery,
  onLogout,
  onOpenCart,
  onOpenInstallModal,
  isInstalled,
  cartCount,
  searchQuery,
  onSearchChange,
  userProfile
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const isGuest = userProfile.role === 'guest' || userProfile.name === 'Invité';
  const isAdmin = userProfile.isAdmin || userProfile.id?.startsWith('AD-') || userProfile.email?.startsWith('AD-');
  const isDelivery = userProfile.role === 'delivery';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#ECE4D8]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: User Profile / Auth State ("Au tout abord, si on monte dessus on est un invité") */}
        <div className="flex items-center gap-1.5">
          {isGuest ? (
            <button
              onClick={onOpenAuth}
              type="button"
              className="flex items-center gap-1.5 py-1 px-2.5 text-[#292524] bg-[#F3ECE0] hover:bg-[#ECE3D5] rounded-full border border-[#E3D8C8] transition-all active:scale-95 text-xs font-medium"
              title="Se connecter"
            >
              <User className="w-3.5 h-3.5 text-[#8C7A68]" />
              <span>Invité</span>
              <span className="text-[10px] bg-[#1C1917] text-[#FAF7F2] px-1.5 py-0.2 rounded-full font-bold">
                Connexion
              </span>
            </button>
          ) : isAdmin ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenAdmin}
                type="button"
                className="flex items-center gap-1.5 py-1 px-2.5 bg-[#1C1917] text-[#E6C694] hover:bg-[#2A2623] rounded-full border border-[#D4AF37]/40 shadow-xs transition-all active:scale-95 text-xs font-semibold"
                title="Ouvrir la Console Administrateur plein écran"
              >
                <span>👑</span>
                <span>{userProfile.id || 'AD-Admin'}</span>
                <span className="hidden sm:inline text-[10px] bg-[#3E3832] text-white px-1.5 py-0.2 rounded-full">
                  Admin
                </span>
              </button>

              <button
                onClick={onLogout}
                type="button"
                className="p-1.5 text-[#8C7A68] hover:text-[#1C1917] hover:bg-[#F3ECE0] rounded-full transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenProfile}
                type="button"
                className="flex items-center gap-1.5 py-1 px-2 text-[#292524] bg-[#F3ECE0]/80 hover:bg-[#ECE3D5] rounded-full border border-[#E3D8C8] transition-all active:scale-95"
                title="Mon profil"
              >
                <div className="w-5 h-5 rounded-full bg-[#1C1917] text-[#FAF7F2] flex items-center justify-center text-[10px] font-semibold">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-[#292524]">
                  {userProfile.name}
                </span>
              </button>

              <button
                onClick={onLogout}
                type="button"
                className="p-1 text-[#8C7A68] hover:text-[#1C1917] rounded-full"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Brand Name "OrA" */}
        <div className="flex-1 flex justify-center text-center">
          <a
            href="#"
            className="inline-flex flex-col items-center select-none"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="font-serif-luxury text-2xl sm:text-3xl font-medium tracking-[0.2em] text-[#1C1917]">
              OrA
            </span>
          </a>
        </div>

        {/* Right: Install App Button, Search & Cart Button */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Mobile APK / App Install Trigger */}
          {onOpenInstallModal && !isInstalled && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="hidden xs:flex items-center gap-1 py-1 px-2.5 bg-[#F4ECE1] hover:bg-[#ECE3D5] text-[#1C1917] rounded-full border border-[#D9CDBF] text-[11px] font-medium transition-all active:scale-95"
              title="Installer l'application sur smartphone (APK Android & iOS)"
            >
              <Smartphone className="w-3 h-3 text-[#8C7A68]" />
              <span className="hidden sm:inline">App Mobile</span>
              <span className="sm:hidden">App</span>
            </button>
          )}

          {/* Search Trigger */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <div className="flex items-center bg-white border border-[#D9CDBF] rounded-full pl-2.5 pr-1.5 py-0.5 sm:py-1 shadow-xs w-36 sm:w-56 transition-all">
                <Search className="w-3 h-3 text-[#8C7A68] shrink-0 mr-1" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Rechercher..."
                  autoFocus
                  className="w-full text-xs text-[#1C1917] bg-transparent focus:outline-none placeholder:text-[#A89887]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    onSearchChange('');
                  }}
                  className="p-0.5 text-[#8C7A68]"
                  aria-label="Fermer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-1.5 sm:p-2 text-[#44403C] hover:bg-[#F3ECE0]/70 rounded-full transition-colors"
                aria-label="Rechercher"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Cart Trigger */}
          <button
            onClick={onOpenCart}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1C1917] text-[#FAF7F2] rounded-full hover:bg-[#2E2926] transition-all active:scale-95 shadow-2xs"
            aria-label="Panier"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-1.5" />
            <span className="text-xs font-medium tabular-nums">
              {cartCount}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
