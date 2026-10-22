/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Truck,
  RotateCcw,
  Shield,
  Building2,
  Search,
  Printer
} from 'lucide-react';
import { LEGAL_DOCUMENTS, LegalSection } from '../data/legalDocuments';

export type LegalTabKey = 'cgv' | 'delivery' | 'returns' | 'privacy' | 'legal_notice';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabKey;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'cgv'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentDoc: LegalSection = LEGAL_DOCUMENTS[activeTab] || LEGAL_DOCUMENTS.cgv;

  const filteredArticles = currentDoc.articles.filter((art) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(query) ||
      art.number.toLowerCase().includes(query) ||
      art.content.some((c) => c.toLowerCase().includes(query))
    );
  });

  const getTabIcon = (tabKey: LegalTabKey) => {
    switch (tabKey) {
      case 'cgv':
        return <FileText className="w-3.5 h-3.5 shrink-0" />;
      case 'delivery':
        return <Truck className="w-3.5 h-3.5 shrink-0" />;
      case 'returns':
        return <RotateCcw className="w-3.5 h-3.5 shrink-0" />;
      case 'privacy':
        return <Shield className="w-3.5 h-3.5 shrink-0" />;
      case 'legal_notice':
        return <Building2 className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { key: LegalTabKey; label: string }[] = [
    { key: 'cgv', label: 'CGV' },
    { key: 'delivery', label: 'Livraison' },
    { key: 'returns', label: 'Retours' },
    { key: 'privacy', label: 'Confidentialité' },
    { key: 'legal_notice', label: 'Mentions légales' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl border border-stone-200 shadow-xl flex flex-col overflow-hidden text-stone-900"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div>
            <h2 id="legal-modal-title" className="text-sm sm:text-base font-semibold text-stone-900">
              Conditions & Informations Légales
            </h2>
            <p className="text-[11px] text-stone-500">
              Boutique YourOrA · Bénin
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimer"
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Fermer"
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-stone-100/70 px-2.5 sm:px-4 py-2 border-b border-stone-200 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {getTabIcon(tab.key)}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Document Title */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-semibold text-stone-900">
            {currentDoc.title}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full text-xs pl-7 pr-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-900 focus:bg-white focus:outline-none placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-stone-50/50">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">
              Aucun résultat pour « {searchQuery} ».
            </div>
          ) : (
            filteredArticles.map((art, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 bg-white rounded-xl border border-stone-200 space-y-1.5 text-xs text-stone-700 leading-relaxed"
              >
                <div className="font-semibold text-stone-900 flex items-baseline gap-1.5">
                  <span className="text-stone-500 font-mono text-[11px]">{art.number}.</span>
                  <span>{art.title}</span>
                </div>
                {art.content.map((p, pIdx) => (
                  <p key={pIdx} className="text-stone-600">
                    {p}
                  </p>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-stone-400">
            Mise à jour : {currentDoc.lastUpdated}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
