/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Package,
  Check,
  Edit2,
  Save,
  Trash2,
  Smartphone,
  Wallet,
  AlertCircle,
  Info,
  ShieldCheck,
  KeyRound,
  Truck,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { UserProfile, Order, SavedMobileMoney } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import {
  BENIN_OPERATORS,
  BeninOperator,
  formatBeninNational,
  formatBeninInternational,
  isValidBeninPhone,
  sanitizeBeninDigits,
  detectBeninOperator
} from '../utils/beninPhone';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  orders: Order[];
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  orders
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'orders'>('profile');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingMM, setIsEditingMM] = useState(false);
  
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Mobile Money Bénin form state
  const initialMMPhone = userProfile.savedMobileMoney?.phoneNumber
    ? formatBeninNational(userProfile.savedMobileMoney.phoneNumber)
    : '01 97 00 12 34';

  const [mmOperator, setMmOperator] = useState<BeninOperator>(
    userProfile.savedMobileMoney?.operator || 'MTN'
  );
  const [mmPhoneNumber, setMmPhoneNumber] = useState(initialMMPhone);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditingProfile(false);
    setSavedSuccess('Coordonnées enregistrées.');
    setTimeout(() => setSavedSuccess(null), 2000);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatBeninNational(val);
    setMmPhoneNumber(formatted);

    const detected = detectBeninOperator(val);
    if (detected && detected !== mmOperator) {
      setMmOperator(detected);
    }
  };

  const isMMPhoneValid = isValidBeninPhone(mmPhoneNumber);

  const handleSaveMM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMMPhoneValid) return;

    const formattedNational = formatBeninNational(mmPhoneNumber);
    const updatedMM: SavedMobileMoney = {
      operator: mmOperator,
      phoneNumber: formattedNational,
      accountName: userProfile.name || 'Client OrA'
    };

    const updated = {
      ...userProfile,
      savedMobileMoney: updatedMM
    };
    onUpdateProfile(updated);
    setIsEditingMM(false);
    setSavedSuccess(`Compte ${BENIN_OPERATORS[mmOperator].name} enregistré.`);
    setTimeout(() => setSavedSuccess(null), 2200);
  };

  const handleRemoveMM = () => {
    const updated = {
      ...userProfile,
      savedMobileMoney: null
    };
    onUpdateProfile(updated);
    setSavedSuccess('Moyen de paiement MoMo supprimé.');
    setTimeout(() => setSavedSuccess(null), 2000);
  };

  const activeOpInfo = BENIN_OPERATORS[mmOperator];
  const digitsCount = sanitizeBeninDigits(mmPhoneNumber).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#141210]/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <aside className="w-screen max-w-md bg-[#FAF7F2] border-r border-[#ECE3D5] shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#ECE3D5] flex items-center justify-between bg-[#FCFAF7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#FAF7F2] flex items-center justify-center font-serif-luxury text-sm font-medium">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'K'}
              </div>
              <div>
                <h3 className="font-serif-luxury text-base font-medium text-[#1C1917]">
                  {userProfile.name || 'Invité'}
                </h3>
                <span className="text-[9px] uppercase tracking-wider text-[#9A8977]">
                  {userProfile.role === 'guest' ? 'Session Invité' : 'Client OrA'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#8C7A68] hover:bg-[#F3ECE1] rounded-full transition-colors"
            >
              <X className="w-5 h-5 stroke-1" />
            </button>
          </div>

          {/* Feedback banner */}
          {savedSuccess && (
            <div className="bg-[#1C1917] text-[#FAF7F2] text-xs py-2 px-4 flex items-center gap-2 border-b border-[#3E3832]">
              <Check className="w-3.5 h-3.5 text-[#E6C694]" />
              <span>{savedSuccess}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#ECE3D5] bg-[#F7F2EB] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                activeTab === 'profile'
                  ? 'border-[#1C1917] text-[#1C1917] bg-[#FCFAF7]'
                  : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                activeTab === 'payments'
                  ? 'border-[#1C1917] text-[#1C1917] bg-[#FCFAF7]'
                  : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#C1931E]" />
              <span>Mobile Money (Bénin)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'border-[#1C1917] text-[#1C1917] bg-[#FCFAF7]'
                  : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Commandes ({orders.length})</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-4 sm:p-5 flex-1 space-y-4">
            
            {/* TAB 1: PROFIL & COORDONNÉES */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8C7A68] tracking-wider">
                    Informations personnelles
                  </span>
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-[#1C1917] hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-xs text-[#8C7A68] hover:underline"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#9A8977] uppercase block">Nom complet</span>
                      <p className="font-medium text-[#1C1917]">{userProfile.name || 'Invité'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#9A8977] uppercase block">Adresse email</span>
                      <p className="font-medium text-[#1C1917]">{userProfile.email || 'Non renseigné'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#9A8977] uppercase block">Numéro de contact</span>
                      <p className="font-mono font-medium text-[#1C1917]">{userProfile.phone || 'Non renseigné'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#9A8977] uppercase block">Adresse de livraison</span>
                      <p className="font-medium text-[#1C1917]">
                        {userProfile.address ? `${userProfile.address}, ${userProfile.city} (Bénin)` : 'Non renseignée'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-3 bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-4 text-xs">
                    <div>
                      <label className="text-[10px] font-medium text-[#78716C] block mb-1">Nom complet</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D9CDBF] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-[#78716C] block mb-1">Adresse email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D9CDBF] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-[#78716C] block mb-1">Téléphone de contact</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+229 01 97 00 12 34"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D9CDBF] rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-[#78716C] block mb-1">Adresse / Quartier</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Quartier Haie Vive, Rue 340"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D9CDBF] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-[#78716C] block mb-1">Ville</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Cotonou"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D9CDBF] rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#1C1917] text-[#FAF7F2] rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer les modifications</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: EXCLUSIVEMENT MOBILE MONEY BÉNIN (MTN, MOOV, CELTIIS) */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇧🇯</span>
                    <span className="text-[10px] uppercase font-semibold text-[#8C7A68] tracking-wider">
                      Compte Mobile Money (FedaPay Bénin)
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Enregistrez votre compte <strong>MTN MoMo</strong>, <strong>Moov Money</strong> ou <strong>Celtiis Cash</strong> pour vos achats.
                  </p>
                </div>

                {!isEditingMM ? (
                  <div>
                    {userProfile.savedMobileMoney ? (
                      <div className="bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-4 space-y-3 text-xs shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            userProfile.savedMobileMoney.operator === 'MTN'
                              ? 'bg-[#FFCC00] text-black border border-[#E6B800]'
                              : userProfile.savedMobileMoney.operator === 'Moov'
                              ? 'bg-[#0055A5] text-white border border-[#004488]'
                              : 'bg-[#008080] text-white border border-[#006666]'
                          }`}>
                            {userProfile.savedMobileMoney.operator === 'MTN'
                              ? 'MTN MoMo Bénin'
                              : userProfile.savedMobileMoney.operator === 'Moov'
                              ? 'Moov Money Bénin'
                              : 'Celtiis Cash Bénin'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMmOperator(userProfile.savedMobileMoney!.operator);
                                setMmPhoneNumber(formatBeninNational(userProfile.savedMobileMoney!.phoneNumber));
                                setIsEditingMM(true);
                              }}
                              className="text-xs text-[#1C1917] hover:underline flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveMM}
                              className="text-xs text-red-700 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#F7F2EB] p-3 rounded-xl space-y-1">
                          <span className="text-[9px] text-[#9A8977] uppercase block font-semibold">Numéro MoMo enregistré</span>
                          <p className="font-mono font-bold text-[#1C1917] text-base tracking-wider">
                            {userProfile.savedMobileMoney.phoneNumber}
                          </p>
                          <p className="text-[10px] text-[#78716C] font-mono">
                            {formatBeninInternational(userProfile.savedMobileMoney.phoneNumber)}
                          </p>
                        </div>

                        <p className="text-[10px] text-[#78716C]">
                          Ce numéro est pré-rempli automatiquement lors de tous vos règlements sur la boutique.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#F7F2EB] border border-[#EAE1D3] rounded-2xl p-5 text-center space-y-2.5 text-xs">
                        <Smartphone className="w-8 h-8 text-[#8C7A68] mx-auto stroke-1" />
                        <p className="font-semibold text-[#1C1917]">Aucun numéro MoMo enregistré</p>
                        <p className="text-[11px] text-[#78716C] max-w-xs mx-auto">
                          Enregistrez votre compte MTN Bénin, Moov Bénin ou Celtiis Bénin pour valider vos achats en un clic.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditingMM(true)}
                          className="mt-1 px-4 py-2 bg-[#1C1917] text-[#FAF7F2] rounded-full text-xs font-semibold shadow-2xs hover:bg-[#2A2623]"
                        >
                          Enregistrer un numéro Mobile Money
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveMM} className="space-y-3.5 bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-4 text-xs">
                    <div className="flex justify-between items-center pb-1 border-b border-[#ECE3D5]">
                      <span className="font-semibold text-xs text-[#1C1917]">Configuration Mobile Money Bénin</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingMM(false)}
                        className="text-xs text-[#8C7A68] hover:underline"
                      >
                        Annuler
                      </button>
                    </div>

                    {/* Operator choice */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#78716C] uppercase block mb-1">
                        Opérateur béninois
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['MTN', 'Moov', 'Celtiis'] as const).map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => setMmOperator(op)}
                            className={`py-2 px-1 rounded-xl border text-center text-xs font-bold transition-all ${
                              mmOperator === op
                                ? op === 'MTN'
                                  ? 'bg-[#FFCC00] text-black border-[#E6B800] ring-1 ring-[#FFCC00]'
                                  : op === 'Moov'
                                  ? 'bg-[#0055A5] text-white border-[#004488] ring-1 ring-[#0055A5]'
                                  : 'bg-[#008080] text-white border-[#006666] ring-1 ring-[#008080]'
                                : 'bg-white text-[#44403C] border-[#D9CDBF] hover:bg-[#F7F2EB]'
                            }`}
                          >
                            <span className="block">{op === 'MTN' ? 'MTN' : op === 'Moov' ? 'Moov' : 'Celtiis'}</span>
                            <span className="text-[9px] font-normal opacity-85 block">
                              {op === 'MTN' ? 'MoMo' : op === 'Moov' ? 'Money' : 'Cash'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-semibold text-[#78716C] uppercase">
                          Numéro {activeOpInfo.name}
                        </label>
                      </div>

                      <div className={`flex items-center bg-white border rounded-xl overflow-hidden ${
                        isMMPhoneValid
                          ? 'border-green-600 ring-1 ring-green-600/30'
                          : 'border-[#D9CDBF]'
                      }`}>
                        <div className="bg-[#F7F2EB] px-2.5 py-1.5 border-r border-[#E3D7C7] flex items-center gap-1 shrink-0 font-mono text-xs font-bold text-[#1C1917]">
                          <span>🇧🇯</span>
                          <span>+229</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={mmPhoneNumber}
                          onChange={handlePhoneInputChange}
                          placeholder="01 97 00 12 34"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-[#1C1917] focus:outline-none"
                        />
                        {isMMPhoneValid && (
                          <div className="pr-2">
                            <Check className="w-4 h-4 text-green-700" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isMMPhoneValid}
                      className={`w-full py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
                        mmOperator === 'MTN'
                          ? 'bg-[#FFCC00] text-black hover:bg-[#E6B800]'
                          : mmOperator === 'Moov'
                          ? 'bg-[#0055A5] text-white hover:bg-[#004488]'
                          : 'bg-[#008080] text-white hover:bg-[#006666]'
                      }`}
                    >
                      Enregistrer mon numéro {activeOpInfo.name}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-semibold text-[#8C7A68] tracking-wider block">
                  Historique de vos commandes
                </span>
                {orders.length === 0 ? (
                  <div className="bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-6 text-center space-y-1.5">
                    <Package className="w-7 h-7 text-[#A89887] mx-auto stroke-1" />
                    <p className="text-xs font-medium text-[#1C1917]">Aucune commande</p>
                    <p className="text-[11px] text-[#78716C]">Vous n'avez passé aucune commande pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-3.5 space-y-2.5 text-xs shadow-2xs">
                        {/* Order Header */}
                        <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-[#ECE3D5]">
                          <span className="font-semibold text-[#1C1917]">Commande du {order.date}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            order.status === 'Livrée'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Expédiée'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'Litige'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#F3ECE1] text-[#2E2823]'
                          }`}>
                            {order.status === 'Expédiée'
                              ? 'En cours de livraison'
                              : order.status === 'Litige'
                              ? 'Livraison reportée'
                              : order.status === 'Confirmée'
                              ? 'Payée - À préparer'
                              : order.status}
                          </span>
                        </div>

                        {/* CODE DE LIVRAISON CLIENT */}
                        {order.deliveryCode && (
                          <div className="bg-[#1C1917] text-[#FAF7F2] rounded-xl p-3 space-y-1.5 text-center">
                            <span className="text-[10px] uppercase font-bold text-[#D6C7B2] flex items-center justify-center gap-1">
                              <KeyRound className="w-3 h-3 text-[#E6C694]" />
                              <span>Votre Code de Livraison</span>
                            </span>
                            <div className="py-1 bg-[#292524] rounded-lg border border-[#443E38]">
                              <p className="font-mono font-bold text-xl tracking-[0.2em] text-[#FFDE9E] select-all">
                                {order.deliveryCode}
                              </p>
                            </div>
                            <p className="text-[10px] text-[#A89887]">
                              {order.status === 'Livrée'
                                ? '✓ Livraison confirmée par le livreur.'
                                : 'À communiquer au livreur à la réception de votre colis.'}
                            </p>
                          </div>
                        )}

                        {/* Items list */}
                        <div className="space-y-1 pt-0.5">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-[#44403C]">
                              <span className="truncate max-w-[200px]">{it.quantity}x {it.productName}</span>
                              <span className="tabular-nums font-medium">{formatFCFA(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Assigned courier info if present */}
                        {order.assignedDeliveryAgentName && (
                          <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#ECE4D8] flex items-center justify-between text-[11px]">
                            <span className="text-[#78716C] flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-[#C1931E]" />
                              <span>Livreur : <strong>{order.assignedDeliveryAgentName}</strong></span>
                            </span>
                          </div>
                        )}

                        {/* Destination */}
                        <div className="text-[10px] text-[#78716C] pt-1 border-t border-[#ECE3D5] flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-[#C1931E] shrink-0 mt-0.5" />
                          <span className="truncate">{order.shippingAddress}</span>
                        </div>

                        {/* Price summary */}
                        <div className="flex justify-between items-baseline font-bold pt-1 border-t border-[#ECE3D5] text-xs">
                          <span className="text-[#57534E]">Total payé (FedaPay)</span>
                          <span className="tabular-nums text-[#1C1917] font-serif-luxury text-sm">{formatFCFA(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-[#FCFAF7] border-t border-[#ECE3D5] text-center text-[10px] text-[#A89887]">
            Passerelle FedaPay Bénin · MTN MoMo · Moov Money · Celtiis Cash
          </div>
        </aside>
      </div>
    </div>
  );
};
