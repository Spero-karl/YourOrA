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
  Clock,
  CheckCircle2,
  RotateCcw,
  Wallet,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Order, DeliveryAgent, Product, UserProfile, OrderStatus, ChatMessage } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { syncDeliveryAgentToSecureAccount } from '../utils/securityAuth';

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
  adminUser,
  onSwitchToClientView,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'products' | 'messages'>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'issue' | 'refunded'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delivery agent modal
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentZone, setAgentZone] = useState('Haie Vive, Cotonou');

  // Concierge chat reply state
  const [replyText, setReplyText] = useState('');
  const [selectedChatClientId, setSelectedChatClientId] = useState<string>('user-karl');

  // ==========================================================
  // Financial & Operational Metrics (Clair & Transparent)
  // ==========================================================
  const unlockedAmount = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Livrée')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const pendingAmount = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'Livrée' && o.status !== 'Remboursée')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const refundedAmount = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Remboursée')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'Livrée' && o.status !== 'Remboursée').length;
  }, [orders]);

  const validatedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Livrée').length;
  }, [orders]);

  const refundedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Remboursée').length;
  }, [orders]);

  // Selected delivery agent for touching/viewing full profile details
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<DeliveryAgent | null>(null);

  // Unique clients with chat messages
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

  // Filtered orders list
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
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER: CLEAN, PROFESSIONAL & HIGH CONTRAST      */}
      {/* Note: NO "Espace Livreur" visible here as strictly asked */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b-2 border-slate-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-serif-luxury font-bold text-amber-300 text-lg">
              O
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                Panneau d'Administration
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-normal border border-slate-700">
                  OrA Bénin
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Gestion simplifiée des commandes, des livraisons et des paiements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSwitchToClientView}
              className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Consulter la boutique en vue client"
            >
              <Eye className="w-4 h-4 text-slate-950" />
              <span>Voir la boutique</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. OPERATIONAL & FINANCIAL KPI CARDS (NETTES & ÉPURÉES)   */}
      {/* Couleurs distinctes du fond, bordures précises, zen      */}
      {/* ======================================================== */}
      <section className="px-4 sm:px-8 pt-6 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Box 1: Commandes à traiter */}
            <div className="bg-white border-2 border-slate-300 hover:border-slate-400 rounded-2xl p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                      Commandes à traiter
                    </span>
                    <span className="text-[10px] text-slate-500">Flux d'expéditions</span>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {activeOrdersCount} en attente
                </span>
              </div>
              <div className="my-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
                  {activeOrdersCount}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Payées par les clients, à préparer ou en cours d'acheminement.
                </p>
              </div>
              <div className="text-xs text-slate-700 pt-3 border-t-2 border-slate-100 font-semibold flex items-center justify-between">
                <span className="text-slate-500">Total en cours :</span>
                <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">{formatFCFA(pendingAmount)}</span>
              </div>
            </div>

            {/* Box 2: Ventes validées */}
            <div className="bg-white border-2 border-slate-300 hover:border-slate-400 rounded-2xl p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                      Ventes validées
                    </span>
                    <span className="text-[10px] text-slate-500">Succès confirmés</span>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {validatedOrdersCount} livrées
                </span>
              </div>
              <div className="my-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
                  {validatedOrdersCount}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Colis remis aux clients et confirmés par code secret.
                </p>
              </div>
              <div className="text-xs text-emerald-800 pt-3 border-t-2 border-slate-100 font-semibold flex items-center justify-between">
                <span className="text-slate-500">Total débloqué :</span>
                <span className="font-mono font-bold text-emerald-900 text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">{formatFCFA(unlockedAmount)}</span>
              </div>
            </div>

            {/* Box 3: Livreurs actifs & Remboursements */}
            <div className="bg-white border-2 border-slate-300 hover:border-slate-400 rounded-2xl p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-300 text-indigo-800 flex items-center justify-center shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                      Livreurs actifs
                    </span>
                    <span className="text-[10px] text-slate-500">Réseau terrain</span>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-950 border border-indigo-200">
                  {deliveryAgents.length} disponibles
                </span>
              </div>
              <div className="my-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-luxury">
                  {deliveryAgents.length}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  Équipe de coursiers prête à livrer sur le terrain.
                </p>
              </div>
              <div className="text-xs text-slate-700 pt-3 border-t-2 border-slate-100 font-semibold flex items-center justify-between">
                <span className="text-slate-500">Total remboursé :</span>
                <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">{formatFCFA(refundedAmount)}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. NAVIGATION PAR ONGLETS (BOUTONS LISIBLES & ÉPURÉS)     */}
      {/* ======================================================== */}
      <div className="px-4 sm:px-8 mb-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5 overflow-x-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Commandes à traiter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'orders' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delivery')}
              className={`py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'delivery'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Livreurs actifs</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'delivery' ? 'bg-blue-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {deliveryAgents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Articles & Stock</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'products' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages clients</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'messages' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {chatMessages.length}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. ESPACE PRINCIPAL DE TRAVAIL                           */}
      {/* ======================================================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pb-12 flex-1">
        
        {/* ====================================================== */}
        {/* ONGLET 1 : COMMANDES CLIENTS                           */}
        {/* ====================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            
            {/* Barre de Recherche et Filtres */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de client, numéro de téléphone, quartier ou code..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 transition-colors font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-2 rounded-xl transition-colors font-bold whitespace-nowrap ${
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
                  className={`px-3 py-2 rounded-xl transition-colors font-bold whitespace-nowrap ${
                    orderFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  À traiter ({activeOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-3 py-2 rounded-xl transition-colors font-bold whitespace-nowrap ${
                    orderFilter === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ventes validées ({validatedOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('issue')}
                  className={`px-3 py-2 rounded-xl transition-colors font-bold whitespace-nowrap ${
                    orderFilter === 'issue'
                      ? 'bg-rose-700 text-white'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Problèmes ({orders.filter((o) => o.status === 'Litige').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('refunded')}
                  className={`px-3 py-2 rounded-xl transition-colors font-bold whitespace-nowrap ${
                    orderFilter === 'refunded'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Remboursées ({refundedOrdersCount})
                </button>
              </div>
            </div>

            {/* Liste des Cartes Commandes */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                <Package className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Aucune commande trouvée</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {orderSearch
                    ? 'Aucun résultat ne correspond à votre filtre de recherche.'
                    : 'Les nouvelles commandes passées sur la boutique apparaîtront ici immédiatement.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord, index) => {
                  const isDelivered = ord.status === 'Livrée';
                  const isReported = ord.status === 'Litige';
                  const isRefunded = ord.status === 'Remboursée';

                  return (
                    <div
                      key={ord.id}
                      className={`rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border-2 ${
                        isDelivered
                          ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200/50'
                          : isReported
                          ? 'bg-rose-50/50 border-rose-400'
                          : isRefunded
                          ? 'bg-slate-50 border-slate-300 opacity-90'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {/* Entête de carte avec couleur distincte pour ventes validées */}
                      <div className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 ${
                        isDelivered
                          ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                          : isReported
                          ? 'bg-rose-100 border-rose-200 text-rose-950'
                          : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`font-extrabold text-sm px-2.5 py-1 rounded-lg border ${
                            isDelivered
                              ? 'bg-white text-emerald-900 border-emerald-300'
                              : 'bg-white text-slate-900 border-slate-300'
                          }`}>
                            Commande #{index + 1}
                          </span>
                          {isDelivered && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Vente validée
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-900">
                            {ord.buyerName || 'Client OrA'}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-xs text-slate-600">
                            {ord.date}
                          </span>
                        </div>

                        {/* Code secret de livraison & Sélecteur de statut */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {ord.deliveryCode && (
                            <div
                              onClick={() => handleCopyId(ord.deliveryCode)}
                              className="cursor-pointer px-3 py-1 bg-amber-50 border-2 border-amber-300 rounded-lg text-xs flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
                              title="Cliquer pour copier le code de remise"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                              <span className="font-mono font-extrabold text-amber-950">
                                Code : {ord.deliveryCode}
                              </span>
                              {copiedId === ord.deliveryCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3 h-3 text-amber-600" />
                              )}
                            </div>
                          )}

                          <select
                            value={ord.status}
                            onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className={`text-xs font-extrabold py-1.5 px-3 rounded-lg border-2 focus:outline-none transition-all ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                                : isReported
                                ? 'bg-rose-100 text-rose-950 border-rose-400'
                                : isRefunded
                                ? 'bg-slate-200 text-slate-800 border-slate-400'
                                : 'bg-white text-slate-900 border-slate-300'
                            }`}
                          >
                            <option value="Confirmée">À préparer</option>
                            <option value="En préparation">En préparation</option>
                            <option value="Expédiée">En livraison</option>
                            <option value="Livrée">Livrée</option>
                            <option value="Litige">Problème signalé</option>
                            <option value="Remboursée">Remboursée</option>
                          </select>
                        </div>
                      </div>

                      {/* Corps de la carte : Coordonnées & Livreur */}
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          
                          {/* Coordonnées & Adresse */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[10px] uppercase font-extrabold text-slate-500 block tracking-wide">
                              Lieu de livraison & Contact
                            </span>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-900 text-xs">
                                  {ord.shippingAddress}
                                </p>
                                {ord.deliveryNote && (
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    Indication : {ord.deliveryNote}
                                  </p>
                                )}
                              </div>
                            </div>
                            {ord.buyerPhone && (
                              <div className="pt-1 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                <a
                                  href={`tel:${ord.buyerPhone}`}
                                  className="text-emerald-800 font-bold hover:underline"
                                >
                                  {ord.buyerPhone}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Attribution du Livreur */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[10px] uppercase font-extrabold text-slate-500 block tracking-wide">
                              Livreur assigné à cette course
                            </span>
                            <select
                              value={ord.assignedDeliveryAgentId || ''}
                              onChange={(e) => onAssignDeliveryAgent(ord.id, e.target.value)}
                              className="w-full bg-white border-2 border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                            >
                              <option value="">-- Aucun livreur assigné --</option>
                              {deliveryAgents.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.name} · {ag.zone}
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-600">
                              {ord.assignedDeliveryAgentName ? (
                                <span className="text-emerald-800 font-semibold">
                                  ✓ Assigné à {ord.assignedDeliveryAgentName}. Une notification locale a été envoyée.
                                </span>
                              ) : (
                                <span>Sélectionnez un livreur pour lui attribuer la course.</span>
                              )}
                            </p>
                          </div>

                        </div>

                        {/* Bannière en cas de problème signalé */}
                        {ord.disputeReason && (
                          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="block text-rose-900 font-extrabold">
                                  Problème signalé par le livreur :
                                </strong>
                                <span className="font-medium">{ord.disputeReason}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onResolveDispute(ord.id, 'release_to_seller')}
                                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Valider la livraison
                              </button>
                              <button
                                type="button"
                                onClick={() => onResolveDispute(ord.id, 'refund_to_buyer')}
                                className="px-3.5 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Rembourser le client
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Pied de carte : Articles et Total */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            {ord.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-slate-50 p-1.5 pr-3 rounded-lg border border-slate-200"
                              >
                                <img
                                  src={it.productImage}
                                  alt={it.productName}
                                  className="w-7 h-7 object-cover rounded-md border border-slate-300"
                                />
                                <span className="text-xs font-bold text-slate-800 max-w-[200px] truncate">
                                  {it.quantity}x {it.productName}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Montant total
                            </span>
                            <span className={`text-base font-extrabold font-mono ${
                              isDelivered
                                ? 'text-emerald-950 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 inline-block'
                                : 'text-slate-900'
                            }`}>
                              {formatFCFA(ord.total)}
                            </span>
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

        {/* ====================================================== */}
        {/* ONGLET 2 : LIVREURS ACTIFS                             */}
        {/* ====================================================== */}
        {activeTab === 'delivery' && (
          <div className="space-y-5">
            {/* Action Bar for Adding Delivery Agent */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Livreurs Partenaires
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {deliveryAgents.length} livreur{deliveryAgents.length > 1 ? 's' : ''} actif{deliveryAgents.length > 1 ? 's' : ''} · Touchez un livreur pour afficher sa fiche
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAgentModalOpen(true)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Ajouter un livreur</span>
              </button>
            </div>

            {/* Delivery Agents Interactive Grid (Touch to view detailed info) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  className="bg-white border-2 border-slate-300 hover:border-slate-500 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group text-left select-none"
                  title="Touchez pour afficher les détails du livreur"
                >
                  <div className="space-y-3.5">
                    {/* Header: Avatar, Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
                          {ag.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                            {ag.name}
                          </h4>
                          <span className="text-xs text-slate-600 font-medium">
                            {ag.phone}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
                        Actif
                      </span>
                    </div>

                    {/* Zone & Vehicle Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-start gap-1.5 text-slate-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{ag.zone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Véhicule : {ag.vehicle || 'Moto Express'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Performance and Tap prompt */}
                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-bold">★ {ag.rating || '5.0'}</span>
                      <span className="text-slate-300">·</span>
                      <span>{ag.completedDeliveries} courses</span>
                    </div>
                    <span className="text-amber-800 text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Voir la fiche <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* ONGLET 3 : ARTICLES & STOCK                            */}
        {/* ====================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Catalogue & Pièces de Luxe
                </h3>
                <p className="text-xs text-slate-500">
                  Ajoutez, modifiez ou mettez en avant les créations sur la boutique.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Ajouter un Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleHeroFeature(p.id)}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full border shadow-sm transition-all ${
                        p.isFeaturedInHero
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : 'bg-white/80 text-slate-400 border-slate-300 hover:text-slate-900'
                      }`}
                      title={p.isFeaturedInHero ? 'Mis en avant dans le Hero' : 'Mettre en avant dans le Hero'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-sm font-extrabold text-slate-900 font-mono mt-1">
                        {formatFCFA(p.price)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* ONGLET 4 : MESSAGES CLIENTS                            */}
        {/* ====================================================== */}
        {activeTab === 'messages' && (
          <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[460px]">
            
            {/* Colonne Gauche : Liste des clients */}
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 block px-1">
                Conversations Clients
              </span>
              <div className="space-y-1">
                {clientsWithMessages.map((c) => (
                  <button
                    key={c.clientId}
                    type="button"
                    onClick={() => setSelectedChatClientId(c.clientId)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      selectedChatClientId === c.clientId
                        ? 'bg-white border-slate-300 shadow-xs'
                        : 'border-transparent hover:bg-white/60'
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

            {/* Colonne Droite : Fil de discussion et Réponse */}
            <div className="md:col-span-2 flex flex-col justify-between p-5 space-y-4">
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
                {chatMessages
                  .filter((m) => (m.clientId || 'user-karl') === selectedChatClientId)
                  .map((m) => {
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                          {m.senderName} · {m.timestamp}
                        </span>
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
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

              <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-slate-200">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrire une réponse bienveillante au client..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Nouveau Livreur Partenaire</h3>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom complet</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="ex: Mathieu Agossa"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="ex: +229 01 97 00 12 34"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone habituelle</label>
                <input
                  type="text"
                  value={agentZone}
                  onChange={(e) => setAgentZone(e.target.value)}
                  placeholder="ex: Cotonou (Haie Vive, Cadjèhoun)"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {products.some((p) => p.id === editingProduct.id) ? 'Modifier l’Article' : 'Ajouter un Article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prix en Francs CFA (XOF)</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Photo du produit (ex: /images/nouvelle-montre.jpg ou URL)
                </label>
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="/images/nouvelle-montre.jpg"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-medium focus:outline-none focus:border-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Placez vos photos dans <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">public/images/</code> avec un nom simple (ex: <span className="font-semibold text-slate-700">nouvelle-montre.jpg</span>).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fiche Détails du Livreur (Affichée au toucher/clic sans identifiant de connexion) */}
      {selectedAgentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Fiche du Livreur Partenaire
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Informations opérationnelles en temps réel
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-slate-900 text-amber-400 font-bold text-xl flex items-center justify-center shadow-xs">
                  {selectedAgentDetails.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {selectedAgentDetails.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
                      Disponible
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {selectedAgentDetails.phone}
                  </p>
                </div>
              </div>

              {selectedAgentDetails.phone && (
                <a
                  href={`tel:${selectedAgentDetails.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Appeler</span>
                </a>
              )}
            </div>

            {/* Statistics and Badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Courses</span>
                <span className="text-base font-bold text-slate-900 font-serif-luxury">
                  {selectedAgentDetails.completedDeliveries}
                </span>
                <span className="text-[10px] text-slate-500 block">finalisées</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Note avis</span>
                <span className="text-base font-bold text-amber-600 font-serif-luxury">
                  ★ {selectedAgentDetails.rating || '5.0'}
                </span>
                <span className="text-[10px] text-slate-500 block">sur 5.0</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Ponctualité</span>
                <span className="text-base font-bold text-emerald-700 font-serif-luxury">
                  100%
                </span>
                <span className="text-[10px] text-slate-500 block">garantie</span>
              </div>
            </div>

            {/* Operational Details */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Zone d'intervention habituelle</span>
                  <p className="font-semibold text-slate-800">{selectedAgentDetails.zone}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Moyen de locomotion</span>
                  <p className="font-semibold text-slate-800">{selectedAgentDetails.vehicle || 'Moto Express Sécurisée'}</p>
                </div>
              </div>
            </div>

            {/* Current Active Deliveries */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-900 block">
                Courses en cours confiées à ce livreur :
              </span>
              {(() => {
                const activeForAgent = orders.filter(
                  (o) => o.assignedDeliveryAgentId === selectedAgentDetails.id && o.status !== 'Livrée' && o.status !== 'Remboursée'
                );

                if (activeForAgent.length === 0) {
                  return (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium">
                      ✓ Aucune course en cours. Ce coursier est immédiatement disponible pour prendre en charge une nouvelle livraison.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {activeForAgent.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{ord.buyerName || 'Client VIP'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate max-w-[240px]">
                            {ord.shippingAddress}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {formatFCFA(ord.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Fermer la fiche
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
