/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  Smartphone,
  ShieldCheck,
  Zap,
  X,
  Check,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem, UserProfile, Order, SavedMobileMoney } from '../types';
import {
  BENIN_OPERATORS,
  BeninOperator,
  formatBeninNational,
  formatBeninInternational,
  isValidBeninPhone,
  detectBeninOperator
} from '../utils/beninPhone';
import { formatFCFA } from '../utils/formatCurrency';
import { BENIN_CITIES } from '../utils/beninLocations';
import { getAssetUrl } from '../utils/imageUtils';

interface CheckoutPageProps {
  primaryProduct?: Product | null;
  cartItems?: CartItem[];
  userProfile: UserProfile;
  onBack: () => void;
  onOrderComplete: (order: Order) => void;
  onSaveMobileMoney?: (mm: SavedMobileMoney) => void;
  onOpenLegalModal?: (tab?: 'cgv' | 'delivery' | 'returns' | 'privacy' | 'legal_notice') => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  primaryProduct,
  cartItems = [],
  userProfile,
  onBack,
  onOrderComplete,
  onSaveMobileMoney,
  onOpenLegalModal
}) => {
  const [quantity, setQuantity] = useState(1);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(true);

  // Exclusive Benin Mobile Money operators: MTN, Moov, Celtiis
  const [selectedOperator, setSelectedOperator] = useState<BeninOperator>(
    userProfile.savedMobileMoney?.operator || 'MTN'
  );

  // Initial phone number formatted with Benin 01 standard
  const initialPhone = userProfile.savedMobileMoney?.phoneNumber
    ? formatBeninNational(userProfile.savedMobileMoney.phoneNumber)
    : userProfile.phone && userProfile.phone.includes('01')
    ? formatBeninNational(userProfile.phone)
    : '01 97 00 12 34';

  const [rawPhoneInput, setRawPhoneInput] = useState(initialPhone);
  const [saveMomoForFuture, setSaveMomoForFuture] = useState(true);

  // Interactive Authorization Prompt states
  const [showAuthorizationPrompt, setShowAuthorizationPrompt] = useState(false);
  const [promptStatus, setPromptStatus] = useState<'idle' | 'authorizing' | 'success'>('idle');
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);

  // Final confirmed order
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [fedaTxnId, setFedaTxnId] = useState<string>('');

  // Delivery details
  const [formData, setFormData] = useState({
    name: userProfile.name && userProfile.name !== 'Invité' ? userProfile.name : 'Client OrA',
    email: userProfile.email || 'client@ora.bj',
    address: userProfile.address || 'Quartier Haie Vive, Rue 340',
    city: userProfile.city || 'Cotonou',
    landmark: 'En face de la pharmacie, portail noir',
    postalCode: userProfile.postalCode || 'BP 1204',
    country: 'Bénin'
  });

  const isSingleProduct = !!primaryProduct;
  const unitPrice = primaryProduct ? primaryProduct.price : 0;
  const subtotal = isSingleProduct
    ? unitPrice * quantity
    : cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const total = subtotal;

  const formattedNational = formatBeninNational(rawPhoneInput);
  const isPhoneValid = isValidBeninPhone(rawPhoneInput);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatBeninNational(val);
    setRawPhoneInput(formatted);

    // Auto-select operator if prefix matches
    const suggested = detectBeninOperator(val);
    if (suggested && suggested !== selectedOperator) {
      setSelectedOperator(suggested);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // STEP 1: Click "Payer" -> Open Interactive Confirmation Prompt (no auto-validation)
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneValid || !hasAgreedTerms) {
      return;
    }

    setCancellationNotice(null);
    setPromptStatus('idle');

    // Generate FedaPay reference
    const generatedTxn = `FEDA-BJ-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setFedaTxnId(generatedTxn);

    // Open the client confirmation prompt
    setShowAuthorizationPrompt(true);
  };

  // STEP 2: The client clicks "Accepter et valider la transaction"
  const handleAcceptTransaction = () => {
    setPromptStatus('authorizing');

    setTimeout(() => {
      setPromptStatus('success');

      setTimeout(() => {
        const internationalPhone = formatBeninInternational(rawPhoneInput);
        const nationalPhone = formatBeninNational(rawPhoneInput);

        // Save for user profile
        if (saveMomoForFuture && onSaveMobileMoney) {
          const newMM: SavedMobileMoney = {
            operator: selectedOperator,
            phoneNumber: nationalPhone,
            accountName: formData.name
          };
          onSaveMobileMoney(newMM);
        }

        const randomOrderId = `CMD-${Math.floor(100 + Math.random() * 900)}`;
        const orderItems = isSingleProduct && primaryProduct
          ? [
              {
                productId: primaryProduct.id,
                productName: primaryProduct.name,
                productImage: primaryProduct.image,
                price: primaryProduct.price,
                quantity: quantity
              }
            ]
          : cartItems.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productImage: item.product.image,
              price: item.product.price,
              quantity: item.quantity
            }));

        const operatorObj = BENIN_OPERATORS[selectedOperator];
        const paymentMethodLabel = `FedaPay · ${operatorObj.serviceName} (${nationalPhone})`;
        const generatedDeliveryCode = `LIV-${Math.floor(1000 + Math.random() * 9000)}`;

        const newOrder: Order = {
          id: randomOrderId,
          clientId: userProfile.id || `client-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'benin'}`,
          date: new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          createdAt: Date.now(),
          items: orderItems,
          subtotal,
          shipping: 0,
          total,
          status: 'Confirmée',
          escrowStatus: 'held',
          deliveryCode: generatedDeliveryCode,
          deliveryNote: formData.landmark ? `Repère livreur : ${formData.landmark}` : 'Remise en main propre contre code secret',
          timeline: [
            {
              id: `evt-${Date.now()}-1`,
              timestamp: Date.now() - 2000,
              action: `Paiement initié via ${operatorObj.name} (${formatFCFA(total)})`,
              actor: 'Client'
            },
            {
              id: `evt-${Date.now()}-2`,
              timestamp: Date.now() - 1000,
              action: 'Paiement sécurisé par FedaPay (Bénin)',
              actor: 'Passerelle FedaPay',
              details: `Réf: ${fedaTxnId} · Déblocage conditionné au code de remise`
            },
            {
              id: `evt-${Date.now()}-3`,
              timestamp: Date.now(),
              action: `Code unique de remise généré (${generatedDeliveryCode})`,
              actor: 'Plateforme OrA',
              details: 'Transmis au client comme preuve d\'engagement'
            }
          ],
          shippingAddress: `${formData.address}, ${formData.city} (Bénin)${formData.landmark ? ` — Repère : ${formData.landmark}` : ''}`,
          paymentMethod: paymentMethodLabel,
          buyerName: formData.name,
          buyerEmail: formData.email,
          buyerPhone: internationalPhone
        };

        setShowAuthorizationPrompt(false);
        setConfirmedOrder(newOrder);
        onOrderComplete(newOrder);
      }, 700);
    }, 1000);
  };

  // STEP 2bis: The client clicks "Refuser / Annuler"
  const handleRejectTransaction = () => {
    setShowAuthorizationPrompt(false);
    setPromptStatus('idle');
    setCancellationNotice(
      `Transaction annulée à votre demande. Aucun montant n'a été prélevé sur votre compte ${BENIN_OPERATORS[selectedOperator].name}.`
    );
  };

  const activeOpInfo = BENIN_OPERATORS[selectedOperator];

  // VIEW 1: Final Order Confirmed (Receipt / Facture acquittée + Séquestre)
  if (confirmedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white border border-[#E8DFD1] rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-[#F4EFE6] text-[#1C1917] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#F9F6F0]">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5] text-[#292524]" />
          </div>

          <div className="space-y-1">
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-medium text-[#1C1917]">
              Paiement & Commande Validés
            </h1>
            <p className="text-xs text-[#78716C]">
              Votre commande est enregistrée et sera préparée avec soin.
            </p>
          </div>

          {/* SIMPLE ZEN DELIVERY CODE CARD */}
          <div className="bg-[#1C1917] text-[#FAF7F2] rounded-3xl p-6 text-center space-y-3 shadow-md border border-[#3E3832]">
            <span className="text-[11px] uppercase tracking-wider text-[#E6C694] font-semibold block">
              Votre Code de Livraison
            </span>

            <p className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.2em] text-[#FFDE9E] py-1 select-all">
              {confirmedOrder.deliveryCode}
            </p>

            <p className="text-xs text-[#D6C7B2] max-w-sm mx-auto leading-relaxed">
              Communiquez ce code à votre livreur au moment où il vous remet votre colis.
            </p>

            <div className="pt-2 border-t border-[#3E3832] text-[11px] text-[#A89887]">
              Votre paiement est sécurisé jusqu'à la réception de votre colis en main propre.
            </div>
          </div>

          <div className="border border-[#ECE4D8] rounded-2xl p-4 sm:p-5 bg-[#FAF7F2] text-left space-y-3.5 text-xs">
            <div className="space-y-2.5">
              {confirmedOrder.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getAssetUrl(it.productImage)}
                      alt={it.productName}
                      className="w-11 h-11 object-cover rounded-xl border border-[#E3DACD] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-[#1C1917] text-xs truncate">{it.productName}</p>
                      <p className="text-[10px] text-[#8C7A68]">Quantité : {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#1C1917] tabular-nums shrink-0">
                    {formatFCFA(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Strict Invoice vs Debit Equality */}
            <div className="border-t border-[#ECE4D8] pt-3 space-y-2">
              <div className="flex justify-between items-baseline text-xs text-[#78716C]">
                <span>Total de la facture</span>
                <span className="font-semibold text-[#1C1917]">{formatFCFA(confirmedOrder.total)}</span>
              </div>
              <div className="flex justify-between items-baseline p-3 rounded-xl bg-white border border-[#E0D5C5]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1C1917]">Montant prélevé de votre compte</span>
                  <span className="text-[10px] text-[#8C7A68]">Débit exact · Zéro frais additionnel</span>
                </div>
                <span className="font-serif-luxury text-lg font-bold text-[#1C1917] tabular-nums">
                  {formatFCFA(confirmedOrder.total)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ECE4D8] space-y-1 text-[11px] text-[#78716C]">
              <p>Moyen de débit : <strong className="text-[#1C1917]">{confirmedOrder.paymentMethod}</strong></p>
              <p>Livraison : {confirmedOrder.shippingAddress}</p>
              <p>Destinataire : {confirmedOrder.buyerName} ({confirmedOrder.buyerPhone})</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 bg-[#1C1917] text-[#FAF7F2] rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-[#2A2623] transition-colors"
          >
            Retourner aux collections
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: Redesigned Luxury Payment Page
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#EAE3D6]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au catalogue</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-[#8C7A68]">
          <span className="text-[#A89887]">01. Sélection</span>
          <span>·</span>
          <span className="text-[#1C1917] font-semibold">02. Règlement</span>
          <span>·</span>
          <span className="text-[#A89887]">03. Confirmation</span>
        </div>
      </div>

      {/* Cancellation Notice Toast if client rejected previous prompt */}
      {cancellationNotice && (
        <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF8EB] border border-[#F3E2B8] text-xs text-[#8C6D23] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C1931E]" />
            <span>{cancellationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCancellationNotice(null)}
            className="text-[#8C6D23] hover:text-black p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side (7 cols): Clean Luxury Payment & Delivery Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleInitiatePayment} className="space-y-6">
            
            {/* Section 1: Mobile Money Operator Choice */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase font-bold text-[#8C7A68] tracking-widest">
                  1. Mode de règlement Mobile Money
                </span>
                <span className="text-[11px] text-[#A89887]">Passerelle FedaPay</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* MTN Bénin */}
                <button
                  type="button"
                  onClick={() => setSelectedOperator('MTN')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedOperator === 'MTN'
                      ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-sm'
                      : 'border-[#E3DACD] bg-white text-[#44403C] hover:border-[#1C1917]/40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-[#FFCC00] text-black font-black text-[9px] flex items-center justify-center">
                    M
                  </span>
                  <span className="text-xs font-semibold leading-tight mt-0.5">MTN Bénin</span>
                  <span className="text-[10px] opacity-75">MoMo</span>
                </button>

                {/* Moov Bénin */}
                <button
                  type="button"
                  onClick={() => setSelectedOperator('Moov')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedOperator === 'Moov'
                      ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-sm'
                      : 'border-[#E3DACD] bg-white text-[#44403C] hover:border-[#1C1917]/40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-[#0055A5] text-white font-black text-[9px] flex items-center justify-center">
                    M
                  </span>
                  <span className="text-xs font-semibold leading-tight mt-0.5">Moov Bénin</span>
                  <span className="text-[10px] opacity-75">Moov Money</span>
                </button>

                {/* Celtiis Bénin */}
                <button
                  type="button"
                  onClick={() => setSelectedOperator('Celtiis')}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedOperator === 'Celtiis'
                      ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-sm'
                      : 'border-[#E3DACD] bg-white text-[#44403C] hover:border-[#1C1917]/40'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-[#008080] text-white font-black text-[9px] flex items-center justify-center">
                    C
                  </span>
                  <span className="text-xs font-semibold leading-tight mt-0.5">Celtiis Bénin</span>
                  <span className="text-[10px] opacity-75">Celtiis Cash</span>
                </button>
              </div>
            </div>

            {/* Section 2: Mobile Money Phone Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-[#8C7A68] tracking-widest block">
                2. Numéro de compte {activeOpInfo.name}
              </label>

              <div className={`flex items-center bg-white border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                isPhoneValid
                  ? 'border-[#1C1917] ring-1 ring-[#1C1917]/10'
                  : 'border-[#E0D7C9] focus-within:border-[#1C1917]'
              }`}>
                {/* Prefix country */}
                <div className="bg-[#FAF7F2] px-3.5 py-3 border-r border-[#ECE4D8] flex items-center gap-1.5 shrink-0 select-none">
                  <span className="text-sm">🇧🇯</span>
                  <span className="text-xs font-mono font-bold text-[#1C1917]">+229</span>
                </div>

                <div className="flex-1 flex items-center px-3.5 py-2">
                  <Smartphone className="w-4 h-4 text-[#8C7A68] mr-2 shrink-0" />
                  <input
                    type="tel"
                    required
                    value={rawPhoneInput}
                    onChange={handlePhoneChange}
                    placeholder="01 97 00 12 34"
                    className="w-full text-sm font-mono font-bold text-[#1C1917] focus:outline-none placeholder:text-[#B5A595]"
                  />
                </div>

                {isPhoneValid && (
                  <div className="pr-3.5">
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      ✓ Prêt
                    </span>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-[#57534E]">
                <input
                  type="checkbox"
                  checked={saveMomoForFuture}
                  onChange={(e) => setSaveMomoForFuture(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[#1C1917]"
                />
                <span className="text-[11px]">
                  Mémoriser ce numéro {activeOpInfo.name} pour mes prochains achats
                </span>
              </label>
            </div>

            {/* Section 3: Delivery Information (Adapted to Benin) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase font-bold text-[#8C7A68] tracking-widest block">
                  3. Coordonnées & Livraison au Bénin
                </span>
                <span className="text-[10px] text-[#A89887]">Remise en main propre contre code</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E0D7C9] rounded-xl focus:border-[#1C1917] focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Adresse email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E0D7C9] rounded-xl focus:border-[#1C1917] focus:outline-none"
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E0D7C9] rounded-xl focus:border-[#1C1917] focus:outline-none font-medium text-[#1C1917]"
                  >
                    {BENIN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Autre ville">Autre commune</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    readOnly
                    value="Bénin (🇧🇯)"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E0D7C9] rounded-xl text-[#57534E] font-medium cursor-default"
                  />
                </div>
              </div>

              {/* Address / Quartier with fast suggestions */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder="Quartier et rue"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E0D7C9] rounded-xl focus:border-[#1C1917] focus:outline-none"
                />

                {/* Popular quarters suggestions for the selected city */}
                {BENIN_CITIES.find((c) => c.name === formData.city) && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[10px]">
                    <span className="text-[#8C7A68] shrink-0 font-medium">Quartiers :</span>
                    {BENIN_CITIES.find((c) => c.name === formData.city)?.popularQuarters.slice(0, 6).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleInputChange('address', `Quartier ${q}`)}
                        className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E0D5C5] text-[#57534E] hover:border-[#1C1917] hover:text-[#1C1917] whitespace-nowrap transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Landmark / Repère pour le coursier */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Repère géographique pour la livraison"
                  value={formData.landmark}
                  onChange={(e) => handleInputChange('landmark', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E0D7C9] rounded-xl focus:border-[#1C1917] focus:outline-none placeholder:text-[#A89887]"
                />
              </div>
            </div>

            {/* Section 4: Acceptation des Conditions Générales */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#57534E]">
                <input
                  type="checkbox"
                  required
                  checked={hasAgreedTerms}
                  onChange={(e) => setHasAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#D0C0AC] text-[#1C1917] focus:ring-[#1C1917]"
                />
                <span className="leading-snug">
                  J’ai lu et j’accepte les{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('cgv')}
                    className="text-[#1C1917] font-semibold underline underline-offset-2 hover:text-[#C5A059]"
                  >
                    Conditions Générales de Vente
                  </button>
                  , la{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('privacy')}
                    className="text-[#1C1917] font-semibold underline underline-offset-2 hover:text-[#C5A059]"
                  >
                    Politique de Confidentialité
                  </button>{' '}
                  ainsi que les conditions de{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal?.('delivery')}
                    className="text-[#1C1917] font-semibold underline underline-offset-2 hover:text-[#C5A059]"
                  >
                    Livraison & Retours
                  </button>
                  .
                </span>
              </label>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isPhoneValid || !hasAgreedTerms}
                className="w-full py-3.5 px-6 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full font-medium text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed group active:scale-99"
              >
                <Lock className="w-3.5 h-3.5 text-[#E6C694]" />
                <span>
                  Procéder au paiement ({formatFCFA(total)})
                </span>
                <span className="text-[#E6C694] group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <p className="text-[10px] text-center text-[#8C7A68] mt-2">
                Un prompt de confirmation vous sera envoyé pour accepter et valider la transaction.
              </p>
            </div>
          </form>
        </div>

        {/* Right Side (5 cols): Elegant Invoice Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#EAE3D6] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 sticky top-20">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#8C7A68]" />
                <h3 className="font-serif-luxury text-base font-semibold text-[#1C1917]">
                  Bordereau de Commande
                </h3>
              </div>
              <span className="text-[10px] font-mono font-medium text-[#8C7A68]">
                Bénin 🇧🇯
              </span>
            </div>

            {/* Product Item / Cart items */}
            {primaryProduct ? (
              <div className="flex gap-3.5 items-start">
                <img
                  src={getAssetUrl(primaryProduct.image)}
                  alt={primaryProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-2xl border border-[#EAE3D6] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[9px] uppercase font-semibold text-[#8C7A68] tracking-wider block">
                    {primaryProduct.category}
                  </span>
                  <h4 className="font-serif-luxury text-sm font-semibold text-[#1C1917] leading-tight line-clamp-1">
                    {primaryProduct.name}
                  </h4>
                  <p className="text-[11px] text-[#78716C] line-clamp-1 font-light">
                    {primaryProduct.description}
                  </p>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-[#E0D7C9] rounded-full bg-[#FAF7F2] px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-1 hover:text-black disabled:opacity-30"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="px-2 text-xs font-bold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-1 hover:text-black"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="font-serif-luxury font-bold text-sm text-[#1C1917] tabular-nums">
                      {formatFCFA(primaryProduct.price * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getAssetUrl(item.product.image)}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-xl border border-[#EAE3D6] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-[#1C1917] truncate">{item.product.name}</p>
                        <p className="text-[10px] text-[#78716C]">{item.quantity} × {formatFCFA(item.product.price)}</p>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums shrink-0">
                      {formatFCFA(item.quantity * item.product.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Breakdown & Mandatory Total = Prelevement Equality */}
            <div className="border-t border-[#EAE3D6] pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>Sous-total articles</span>
                <span className="font-medium text-[#1C1917]">{formatFCFA(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Frais de livraison</span>
                <span className="text-green-800 font-semibold">Offerte</span>
              </div>

              {/* Total Facture */}
              <div className="border-t border-[#EAE3D6] pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-serif-luxury text-sm font-semibold text-[#1C1917] block">
                    Total à régler
                  </span>
                  <span className="text-[10px] text-[#8C7A68]">
                    Débit direct {activeOpInfo.name} · Sans frais
                  </span>
                </div>
                <span className="font-serif-luxury text-lg font-bold text-[#1C1917] tabular-nums">
                  {formatFCFA(total)}
                </span>
              </div>
            </div>

            {/* Reassurance & Legal Guarantees */}
            <div className="pt-3 border-t border-[#EAE3D6] space-y-1.5 text-[11px] text-[#78716C]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#1C1917] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Paiement sous séquestre FedaPay</span>
                </span>
                <span>Code secret à la livraison</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span>TVA Bénin (5%) incluse</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal?.('cgv')}
                  className="hover:underline hover:text-[#1C1917]"
                >
                  Conditions & Garanties
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* INTERACTIVE AUTHORIZATION PROMPT (Demande d'autorisation de prélèvement chez le client) */}
      {showAuthorizationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E3DACD] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Top Prompt Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                  selectedOperator === 'MTN'
                    ? 'bg-[#FFCC00] text-black shadow-xs'
                    : selectedOperator === 'Moov'
                    ? 'bg-[#0055A5] text-white shadow-xs'
                    : 'bg-[#008080] text-white shadow-xs'
                }`}>
                  {selectedOperator === 'MTN' ? 'MTN' : selectedOperator === 'Moov' ? 'Moov' : 'SBIN'}
                </div>
                <div>
                  <h3 className="font-serif-luxury text-base font-bold text-[#1C1917]">
                    Autorisation de Débit
                  </h3>
                  <p className="text-[11px] text-[#78716C]">
                    Prompt Mobile Money ({activeOpInfo.name})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRejectTransaction}
                disabled={promptStatus === 'authorizing'}
                className="p-1.5 text-[#8C7A68] hover:text-[#1C1917] rounded-full transition-colors disabled:opacity-40"
                title="Annuler"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Notice */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D6] space-y-2 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>Bénéficiaire</span>
                <strong className="text-[#1C1917]">Maison OrA (Boutique)</strong>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Numéro de compte débité</span>
                <strong className="text-[#1C1917] font-mono">
                  +229 {formattedNational}
                </strong>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Réf. Transaction FedaPay</span>
                <span className="font-mono text-[10px] text-[#8C7A68]">{fedaTxnId}</span>
              </div>
              <div className="border-t border-[#E5DACD] pt-2 flex justify-between items-baseline font-bold">
                <span className="text-[#1C1917]">Montant exact à débiter</span>
                <span className="text-base text-[#1C1917] font-serif-luxury">
                  {formatFCFA(total)}
                </span>
              </div>
            </div>

            {/* Operator validation notice (no secret code asked by the app) */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D6] space-y-1.5 text-xs text-[#57534E]">
              <div className="flex items-center gap-2 font-semibold text-[#1C1917]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Validation sur votre mobile ({activeOpInfo.name})</span>
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Une notification de débit de <strong>{formatFCFA(total)}</strong> a été transmise à votre opérateur <strong>{activeOpInfo.name}</strong> sur le numéro <strong>+229 {formattedNational}</strong>.
              </p>
              <p className="text-[11px] text-[#8C7A68]">
                Confirmez l'opération directement auprès de votre opérateur sur votre téléphone, puis cliquez sur le bouton ci-dessous pour valider votre commande.
              </p>
            </div>

            {/* Action Buttons: Client accepts or rejects */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAcceptTransaction}
                disabled={promptStatus === 'authorizing'}
                className="w-full py-3.5 px-4 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
              >
                {promptStatus === 'authorizing' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Vérification de la confirmation...</span>
                  </>
                ) : promptStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Transaction confirmée !</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#E6C694]" />
                    <span>J'ai confirmé la transaction ({activeOpInfo.name})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRejectTransaction}
                disabled={promptStatus === 'authorizing'}
                className="w-full py-2.5 px-4 border border-[#D9CDBF] hover:bg-[#F5EFE6] text-[#57534E] rounded-full font-medium text-xs transition-colors"
              >
                Annuler la transaction
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
