import React from 'react';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Share, ExternalLink } from 'lucide-react';

interface APKInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectInstall: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export const APKInstallModal: React.FC<APKInstallModalProps> = ({
  isOpen,
  onClose,
  onDirectInstall,
  isInstallable,
  isIOS,
  isAndroid
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#141210]/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#FCFAF7] text-left shadow-2xl transition-all w-full max-w-lg border border-[#ECE3D5] p-5 sm:p-7 space-y-5">
          
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#F3ECE1] text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1917] text-[#E6C694] flex items-center justify-center mx-auto shadow-md border border-[#E6C694]/30">
              <Smartphone className="w-7 h-7" />
            </div>
            <span className="font-serif-luxury text-xl font-bold tracking-wider text-[#1C1917] block">
              Application Mobile OrA
            </span>
            <p className="text-xs text-[#78716C]">
              Installez l'application directement sur votre smartphone Android (format APK natif) ou iPhone.
            </p>
          </div>

          {/* Direct Install CTA Button */}
          {isInstallable && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  onDirectInstall();
                  onClose();
                }}
                className="w-full py-3 px-5 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-[#E6C694]" />
                <span>Installer maintenant (Android APK / WebAPK)</span>
              </button>
            </div>
          )}

          {/* Step by step installation guides */}
          <div className="space-y-3 text-xs">
            
            {/* 1. Android Installation Guide (WebAPK) */}
            <div className="bg-[#FAF7F2] border border-[#ECE3D5] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#FAF7F2] flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <h4 className="font-bold text-[#1C1917]">
                  Installation Directe sur Android (Génération automatique de l'APK)
                </h4>
              </div>
              <p className="text-[11px] text-[#57534E] leading-relaxed">
                Le système Android transforme automatiquement cette application en <strong>paquet APK natif (WebAPK)</strong> sans passer par un store tiers :
              </p>
              <ul className="text-[11px] text-[#57534E] space-y-1 list-disc list-inside">
                <li>Ouvrez le site dans <strong>Google Chrome</strong> sur votre téléphone Android.</li>
                <li>Appuyez sur le menu (les <strong>3 points verticaux</strong> en haut à droite).</li>
                <li>Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                <li>Android compile et installe l'APK directement parmi vos applications mobiles !</li>
              </ul>
            </div>

            {/* 2. iPhone / iOS Guide */}
            <div className="bg-[#FAF7F2] border border-[#ECE3D5] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#FAF7F2] flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <h4 className="font-bold text-[#1C1917]">
                  Installation sur iPhone / iPad (iOS)
                </h4>
              </div>
              <ul className="text-[11px] text-[#57534E] space-y-1 list-disc list-inside">
                <li>Ouvrez le site dans <strong>Safari</strong>.</li>
                <li>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3 h-3 inline text-[#1C1917] ml-0.5 mr-0.5" /> (le carré avec la flèche vers le haut).</li>
                <li>Faites défiler et touchez <strong>« Sur l'écran d'accueil »</strong>.</li>
              </ul>
            </div>

            {/* 3. Compiler un APK autonome hors-ligne (Bubblewrap / CLI) */}
            <div className="bg-[#F4ECE1]/60 border border-[#E3D7C7] rounded-2xl p-3.5 space-y-1.5 text-[11px] text-[#57534E]">
              <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                <ShieldCheck className="w-4 h-4 text-[#8C7A68]" />
                <span>Vous souhaitez un fichier .apk brut autonome ?</span>
              </div>
              <p>
                Vous pouvez empaqueter ce projet en fichier <code>.apk</code> autonome avec l'outil officiel Google <strong>Bubblewrap</strong> :
              </p>
              <code className="block bg-[#1C1917] text-[#FAF7F2] p-2 rounded-lg font-mono text-[10px] select-all overflow-x-auto">
                npx @bubblewrap/cli build
              </code>
              <p className="text-[10px] text-[#8C7A68]">
                Toutes les instructions de compilation APK sont détaillées dans le fichier <code>guideread.me</code> à la racine.
              </p>
            </div>

          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#FAF7F2] border border-[#D9CDBF] text-[#44403C] hover:bg-[#F3ECE1] rounded-full text-xs font-semibold"
            >
              Compris
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
