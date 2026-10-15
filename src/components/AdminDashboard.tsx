/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  Layers,
  Eye,
  LogOut,
  Search,
  Plus,
  MapPin,
  KeyRound,
  Check,
  Edit2,
  Trash2,
  Star,
  X,
  Phone,
  AlertCircle,
  MessageSquare,
  Send,
  Copy,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Order, DeliveryAgent, Product, UserProfile, OrderStatus, ChatMessage } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { syncDeliveryAgentToSecureAccount } from '../utils/securityAuth';
import { getAssetUrl } from '../utils/imageUtils';

interface AdminDashboardProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleHeroFeature: (productId: string) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignDeliveryAgent: (orderId: string, agentId: string) => void;
  onResolveDispute: (orderId: string, resolution: 'release_to_seller' | 'refund_to_buyer') => void;
  deliveryAgents: DeliveryAgent[];
  onAddDeliveryAgent: (agent: DeliveryAgent) => void;
  chatMessages: ChatMessage[];
  onSendAdminReplyToClient: (clientId: string, replyText: string) => void;
  onSetClientSupportDuration?: (clientId: string, hours: number) => void;
  adminUser: UserProfile;
  onSwitchToClientView: () => void;
  onOpenDeliveryPortal?: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleHeroFeature,
  orders,
  onUpdateOrderStatus,
  onAssignDeliveryAgent,
  onResolveDispute,
  deliveryAgents,
  onAddDeliveryAgent,
  chatMessages,
  onSendAdminReplyToClient,
  onSwitchToClientView,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'products' | 'messages'>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'issue' | 'refunded'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Produit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal Livreur
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentZone, setAgentZone] = useState('Haie Vive, Cotonou');

  // Chat
  const [replyText, setReplyText] = useState('');
  const [selectedChatClientId, setSelectedChatClientId] = useState<string>('user-karl');

  // Fiche Livreur
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<DeliveryAgent | null>(null);

  // Métriques
  const validatedAmount = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Livrée')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'Livrée' && o.status !== 'Remboursée').length;
  }, [orders]);

  const validatedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Livrée').length;
  }, [orders]);

  // Clients avec messages
  const clientsWithMessages = useMemo(() => {
    const map = new Map<string, { clientId: string; name: string; lastMessage: string; timestamp: string }>();
    chatMessages.forEach((m) => {
      const cid = m.clientId || 'visiteur';
      map.set(cid, {
        clientId: cid,
        name: m.senderName || 'Client',
        lastMessage: m.text,
        timestamp: m.timestamp
      });
    });
    return Array.from(map.values());
  }, [chatMessages]);

  // Commandes filtrées
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (orderFilter === 'pending' && (ord.status === 'Livrée' || ord.status === 'Remboursée')) return false;
      if (orderFilter === 'delivered' && ord.status !== 'Livrée') return false;
      if (orderFilter === 'issue' && ord.status !== 'Litige') return false;
      if (orderFilter === 'refunded' && ord.status !== 'Remboursée') return false;

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchName = (ord.buyerName || '').toLowerCase().includes(q);
        const matchPhone = (ord.buyerPhone || '').toLowerCase().includes(q);
        const matchAddress = ord.shippingAddress.toLowerCase().includes(q);
        const matchNote = (ord.deliveryNote || '').toLowerCase().includes(q);
        const matchCode = (ord.deliveryCode || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchAddress || matchNote || matchCode;
      }
      return true;
    });
  }, [orders, orderFilter, orderSearch]);

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !agentPhone.trim()) return;

    const cleanZone = agentZone.trim() || 'Cotonou';
    const citySlug = cleanZone.split(/[, -]/)[0].toUpperCase();
    const cleanId = `LIVREUR-${citySlug}-${Math.floor(100 + Math.random() * 900)}`;

    const newAgent: DeliveryAgent = {
      id: cleanId,
      name: agentName.trim(),
      phone: agentPhone.trim(),
      zone: cleanZone,
      status: 'active',
      completedDeliveries: 0,
      rating: 5.0,
      joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onAddDeliveryAgent(newAgent);
    syncDeliveryAgentToSecureAccount(newAgent);
    setIsAgentModalOpen(false);
    setAgentName('');
    setAgentPhone('');
    setAgentZone('Haie Vive, Cotonou');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const exists = products.some((p) => p.id === editingProduct.id);
    if (exists) {
      onUpdateProduct(editingProduct);
    } else {
      onAddProduct(editingProduct);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      price: 150000,
      image: '/images/nouvelle-montre.jpg',
      description: 'Pièce authentique d’exception pour le Bénin.',
      category: 'Horlogerie',
      categorySlug: 'horlogerie',
      inStock: true,
      rating: 5,
      reviewsCount: 1,
      isFeaturedInHero: false
    });
    setIsProductModalOpen(true);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendAdminReplyToClient(selectedChatClientId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* BARRE SUPÉRIEURE ÉLÉGANTE ET ÉPURÉE */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-serif font-black flex items-center justify-center text-base shadow-sm">
              O
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Administration OrA
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToClientView}
              className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Boutique</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3 INDICATEURS CLÉS ESSENTIELS */}
      <section className="px-4 sm:px-8 pt-5 pb-2">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Commandes en cours</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{pendingOrdersCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Commandes livrées</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{validatedOrdersCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Chiffre d'affaires livré</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{formatFCFA(validatedAmount)}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ONGLETS ÉPURÉS */}
      <div className="px-4 sm:px-8 my-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-xs flex items-center gap-1 overflow-x-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Commandes</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'orders' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delivery')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'delivery'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Livreurs</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'delivery' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {deliveryAgents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Produits</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'products' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'messages' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {chatMessages.length}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pb-10 flex-1">
        
        {/* ONGLET 1 : COMMANDES */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Recherche & Filtres */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par client, téléphone, quartier, code..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    orderFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Toutes ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('pending')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    orderFilter === 'pending'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  En cours ({pendingOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    orderFilter === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Livrées ({validatedOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('issue')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                    orderFilter === 'issue'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  Problèmes ({orders.filter((o) => o.status === 'Litige').length})
                </button>
              </div>
            </div>

            {/* Cartes Commandes */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord, index) => {
                  const isDelivered = ord.status === 'Livrée';
                  const isReported = ord.status === 'Litige';

                  return (
                    <div
                      key={ord.id}
                      className={`bg-white rounded-xl shadow-xs border transition-all ${
                        isDelivered
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isReported
                          ? 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Entête */}
                      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-xs text-slate-900">
                            {ord.buyerName || 'Client'}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500">
                            {ord.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.deliveryCode && (
                            <button
                              type="button"
                              onClick={() => handleCopyId(ord.deliveryCode)}
                              className="px-2.5 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md text-[11px] flex items-center gap-1.5 transition-colors"
                              title="Copier le code de livraison"
                            >
                              <KeyRound className="w-3 h-3 text-amber-700" />
                              <span className="font-mono font-bold text-amber-900">
                                {ord.deliveryCode}
                              </span>
                              {copiedId === ord.deliveryCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-600" />
                              )}
                            </button>
                          )}

                          <select
                            value={ord.status}
                            onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className="text-xs font-bold py-1 px-2.5 rounded-md border border-slate-200 bg-white focus:outline-none"
                          >
                            <option value="Confirmée">Confirmée</option>
                            <option value="En préparation">En préparation</option>
                            <option value="Expédiée">En livraison</option>
                            <option value="Livrée">Livrée</option>
                            <option value="Litige">Litige</option>
                            <option value="Remboursée">Remboursée</option>
                          </select>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          
                          {/* Destination */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <p className="font-medium text-slate-800">{ord.shippingAddress}</p>
                            </div>
                            {ord.buyerPhone && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <a href={`tel:${ord.buyerPhone}`} className="text-slate-700 font-semibold hover:underline">
                                  {ord.buyerPhone}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Livreur assigné */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Livreur assigné</p>
                            <select
                              value={ord.assignedDeliveryAgentId || ''}
                              onChange={(e) => onAssignDeliveryAgent(ord.id, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
                            >
                              <option value="">Non assigné</option>
                              {deliveryAgents.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.name} ({ag.zone})
                                </option>
                              ))}
                            </select>
                          </div>

                        </div>

                        {/* Problème */}
                        {ord.disputeReason && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-rose-900">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span><strong>Problème :</strong> {ord.disputeReason}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onResolveDispute(ord.id, 'release_to_seller')}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                              >
                                Valider livraison
                              </button>
                              <button
                                type="button"
                                onClick={() => onResolveDispute(ord.id, 'refund_to_buyer')}
                                className="px-2.5 py-1 bg-rose-700 text-white rounded text-xs font-semibold"
                              >
                                Rembourser
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Articles & Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <img src={getAssetUrl(it.productImage)} alt={it.productName} className="w-5 h-5 object-cover rounded" />
                                <span className="font-medium text-slate-700 text-[11px]">{it.quantity}x {it.productName}</span>
                              </div>
                            ))}
                          </div>

                          <div className="font-bold text-slate-900 font-mono text-sm">
                            {formatFCFA(ord.total)}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ONGLET 2 : LIVREURS */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Livreurs ({deliveryAgents.length})</h3>
                <p className="text-xs text-slate-500">Touchez un profil pour voir ses détails</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAgentModalOpen(true)}
                className="py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Nouveau livreur</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {deliveryAgents.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgentDetails(ag)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAgentDetails(ag);
                    }
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm">
                          {ag.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                            {ag.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">{ag.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Actif
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="truncate">{ag.zone}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">★ {ag.rating || '5.0'}</span>
                      <span>·</span>
                      <span>{ag.completedDeliveries} livraisons</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 3 : PRODUITS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Articles ({products.length})</h3>
                <p className="text-xs text-slate-500">Catalogue de la boutique</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajouter un article</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
                >
                  <div className="relative aspect-square bg-slate-100">
                    <img src={getAssetUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onToggleHeroFeature(p.id)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full border shadow-xs transition-colors ${
                        p.isFeaturedInHero
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : 'bg-white/90 text-slate-400 border-slate-200 hover:text-slate-800'
                      }`}
                      title={p.isFeaturedInHero ? 'En vedette' : 'Mettre en vedette'}
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{p.category}</span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                      <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">{formatFCFA(p.price)}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET 4 : MESSAGES CLIENTS */}
        {activeTab === 'messages' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[420px]">
            
            <div className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block px-1">
                Clients
              </span>
              <div className="space-y-1">
                {clientsWithMessages.map((c) => (
                  <button
                    key={c.clientId}
                    type="button"
                    onClick={() => setSelectedChatClientId(c.clientId)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                      selectedChatClientId === c.clientId
                        ? 'bg-white border-slate-300 shadow-xs'
                        : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900 font-bold">{c.name}</strong>
                      <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {c.lastMessage}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between p-4 space-y-3">
              <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
                {chatMessages
                  .filter((m) => (m.clientId || 'user-karl') === selectedChatClientId)
                  .map((m) => {
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                          {m.senderName} · {m.timestamp}
                        </span>
                        <div
                          className={`max-w-[80%] p-2.5 rounded-xl text-xs font-medium ${
                            isAdmin
                              ? 'bg-slate-900 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrire votre message..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Envoyer</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </main>

      {/* Modal Ajout Livreur */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Ajouter un Livreur</h3>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom complet</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="ex: Mathieu Agossa"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="ex: +229 01 97 00 12 34"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Zone de livraison</label>
                <input
                  type="text"
                  value={agentZone}
                  onChange={(e) => setAgentZone(e.target.value)}
                  placeholder="ex: Haie Vive, Cotonou"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Produit */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {products.some((p) => p.id === editingProduct.id) ? 'Modifier l’article' : 'Ajouter un article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prix (FCFA)</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Photo (/images/nom-photo.jpg)
                </label>
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="/images/nouvelle-montre.jpg"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fiche Détails Livreur */}
      {selectedAgentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Fiche Livreur</h3>
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 font-bold text-base flex items-center justify-center">
                {selectedAgentDetails.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedAgentDetails.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {selectedAgentDetails.phone}
                </p>
              </div>
              {selectedAgentDetails.phone && (
                <a
                  href={`tel:${selectedAgentDetails.phone}`}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  title="Appeler"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Zone :</span>
                <span className="font-semibold text-slate-800">{selectedAgentDetails.zone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Courses livrées :</span>
                <span className="font-semibold text-slate-800">{selectedAgentDetails.completedDeliveries}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Note moyenne :</span>
                <span className="font-bold text-amber-600">★ {selectedAgentDetails.rating || '5.0'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
