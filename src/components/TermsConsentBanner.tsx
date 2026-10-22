/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ChevronRight, FileText } from 'lucide-react';
import { LegalTabKey } from './LegalModal';

interface TermsConsentBannerProps {
  onOpenLegalModal: (tab?: LegalTabKey) => void;
}

const STORAGE_KEY = 'ora_terms_accepted_v1';

export const TermsConsentBanner: React.FC<TermsConsentBannerProps> = ({
  onOpenLegalModal
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        // Small delay so it animates in cleanly after initial render
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1C1917] text-[#FAF7F2] p-4 sm:p-5 rounded-3xl border border-[#C5A059]/40 shadow-2xl flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2A2623] border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif-luxury text-sm font-semibold tracking-wide text-white">
                Conditions Générales & Vie Privée
              </h4>
              <p className="text-[11px] text-[#A89887]">
                Plateforme YourOrA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAccept}
            className="p-1 text-[#A89887] hover:text-white rounded-full transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-[#D6CEBF] leading-relaxed">
          En poursuivant votre navigation sur YourOrA, vous acceptez nos{' '}
          <button
            type="button"
            onClick={() => onOpenLegalModal('cgv')}
            className="text-[#C5A059] underline underline-offset-2 hover:text-[#E6C694] font-medium"
          >
            Conditions Générales de Vente
          </button>
          , notre{' '}
          <button
            type="button"
            onClick={() => onOpenLegalModal('privacy')}
            className="text-[#C5A059] underline underline-offset-2 hover:text-[#E6C694] font-medium"
          >
            Politique de Confidentialité
          </button>{' '}
          ainsi que nos conditions de{' '}
          <button
            type="button"
            onClick={() => onOpenLegalModal('delivery')}
            className="text-[#C5A059] underline underline-offset-2 hover:text-[#E6C694] font-medium"
          >
            Livraison
          </button>{' '}
          et de{' '}
          <button
            type="button"
            onClick={() => onOpenLegalModal('returns')}
            className="text-[#C5A059] underline underline-offset-2 hover:text-[#E6C694] font-medium"
          >
            Retour
          </button>
          .
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2.5 px-4 bg-[#C5A059] hover:bg-[#D4AF37] text-[#1C1917] rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center shadow-xs active:scale-98"
          >
            Accepter et continuer
          </button>

          <button
            type="button"
            onClick={() => onOpenLegalModal('cgv')}
            className="py-2.5 px-3 rounded-xl bg-[#2A2623] hover:bg-[#38332E] text-xs text-[#D6CEBF] hover:text-white border border-[#443D36] transition-all whitespace-nowrap"
          >
            Consulter
          </button>
        </div>
      </div>
    </div>
  );
};
