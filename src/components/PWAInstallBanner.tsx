import React, { useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
  onDirectInstall: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onOpenModal,
  onDirectInstall,
  isInstallable,
  isInstalled
}) => {
  const [dismissed, setDismissed] = useState(false);

  // If already installed as an app or dismissed, hide banner
  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-[#1C1917] text-[#FAF7F2] border-b border-[#3E3832] px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#E6C694] text-[#1C1917] flex items-center justify-center font-bold text-xs shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <p className="truncate text-[11px] sm:text-xs">
            <strong className="text-[#E6C694]">Application Mobile OrA :</strong> Installez sur votre téléphone (Android APK & iOS)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (isInstallable) {
                onDirectInstall();
              } else {
                onOpenModal();
              }
            }}
            className="py-1 px-3 bg-[#E6C694] hover:bg-[#F3DDBA] text-[#1C1917] rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3 h-3" />
            <span>Installer l'App</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-[#A89887] hover:text-[#FAF7F2] rounded-full"
            aria-label="Fermer le bandeau"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
