/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
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
  Clock,
  PieChart,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Tag,
  ArrowLeft,
  Printer,
  Sparkles,
  ShieldCheck,
  Percent,
  CheckCheck,
  UserCheck,
  Timer
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
  onClearClientMessages?: (clientId: string) => void;
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
  onClearClientMessages,
  onSwitchToClientView,
  onLogout
}) => {
  // Navigation tabs: 'orders' | 'delivery' | 'products' | 'messages' (SANS finance/chiffre d'affaire dans la barre)
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'products' | 'messages'>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'delivered' | 'issue' | 'refunded'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deuxième Dashboard Chiffre d'Affaires (Ouvert uniquement au clic sur le Chiffre d'Affaires)
  const [isRevenueDashboardOpen, setIsRevenueDashboardOpen] = useState(false);

  // Modal Produit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Livreur (Enregistrement par Login SANS mot de passe)
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentLogin, setAgentLogin] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentZone, setAgentZone] = useState('Cotonou (Haie Vive, Cadjèhoun, Fidjrossè)');
  const [agentCreationSuccess, setAgentCreationSuccess] = useState<string | null>(null);

  // Chat style WhatsApp / Messenger
  const [replyText, setReplyText] = useState('');
  const [selectedChatClientId, setSelectedChatClientId] = useState<string | null>(null);
  const [chatSearch, setChatSearch] = useState('');

  // Fiche Livreur
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<DeliveryAgent | null>(null);

  // ==========================================================
  // CALCULS FINANCIERS & RÉPARTITION COMPLÈTE
  // ==========================================================
  const deliveredOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Livrée');
  }, [orders]);

  const validatedAmount = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [deliveredOrders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'Livrée' && o.status !== 'Remboursée').length;
  }, [orders]);

  const validatedOrdersCount = useMemo(() => {
    return deliveredOrders.length;
  }, [deliveredOrders]);

  // Répartition financière : TVA 5%, Commissions livreurs selon destination, Part nette OrA
  const financialBreakdown = useMemo(() => {
    const tva = Math.round(validatedAmount * 0.05);

    let deliveryCommissions = 0;
    let cotonouCourses = 0;
    let calaviGodomeyCourses = 0;
    let plusLoinCourses = 0;

    const detailedCourses = deliveredOrders.map((o) => {
      const addr = (o.shippingAddress || '').toLowerCase();
      let commission = 1000;
      let zoneName = 'Plus loin / Hors zone';

      if (addr.includes('cotonou') || addr.includes('haie vive') || addr.includes('cadjehoun') || addr.includes('fidjrosse') || addr.includes('littoral')) {
        commission = 500;
        zoneName = 'Cotonou Intra';
        cotonouCourses++;
      } else if (addr.includes('calavi') || addr.includes('godomey') || addr.includes('abomey-calavi')) {
        commission = 800;
        zoneName = 'Calavi / Godomey';
        calaviGodomeyCourses++;
      } else {
        commission = 1000;
        zoneName = 'Porto-Novo / Plus loin';
        plusLoinCourses++;
      }

      deliveryCommissions += commission;
      const orderTva = Math.round(o.total * 0.05);
      const orderNet = Math.max(0, o.total - orderTva - commission);

      return {
        order: o,
        zoneName,
        commission,
        tva: orderTva,
        net: orderNet
      };
    });

    const netAmount = Math.max(0, validatedAmount - tva - deliveryCommissions);

    return {
      tva,
      deliveryCommissions,
      cotonouCourses,
      calaviGodomeyCourses,
      plusLoinCourses,
      netAmount,
      detailedCourses
    };
  }, [validatedAmount, deliveredOrders]);

  // ==========================================================
  // MESSAGERIE ASSISTANCE - RÈGLE STRICTE UTILISATEUR :
  // 1. Seuls les clients qui ont effectivement écrit à l'assistance apparaissent ici !
  // 2. Chaque compte client apparaît avec son nom de compte client.
  // 3. Suppression automatique côté admin 1 jour (24h) après la livraison validée.
  // ==========================================================
  const clientConversations = useMemo(() => {
    const map = new Map<
      string,
      {
        clientId: string;
        name: string;
        lastMessage: string;
        timestamp: string;
        unread: boolean;
        phone?: string;
        city?: string;
        orderCount: number;
        deliveredAt?: number;
        isDelivered: boolean;
        hoursUntilAdminPurge?: number;
      }
    >();

    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 jour = 24h

    // Regrouper les messages par client
    chatMessages.forEach((m) => {
      const cid = m.clientId;
      if (!cid) return;

      // Chercher si ce client a au moins un message envoyé par lui-même (ou une discussion active)
      const clientHasWritten = chatMessages.some(
        (msg) => msg.clientId === cid && msg.sender === 'user'
      );

      // Si le client n'a pas encore écrit à l'assistance, sa discussion NE VIENT PAS chez nous !
      if (!clientHasWritten) {
        return;
      }

      // Chercher les commandes de ce client
      const matchedOrder = orders.find(
        (o) => o.clientId === cid || (o.buyerEmail && o.buyerEmail === cid)
      );

      // Règle de suppression automatique côté admin : 1 jour après livraison validée
      const isDelivered = matchedOrder?.status === 'Livrée';
      const deliveredAt = matchedOrder?.deliveredAt || (isDelivered ? matchedOrder?.createdAt : undefined);

      if (isDelivered && deliveredAt) {
        const elapsedSinceDelivery = Date.now() - deliveredAt;
        if (elapsedSinceDelivery >= ONE_DAY_MS) {
          // Plus d'un jour après la livraison validée -> supprimé côté admin !
          return;
        }
      }

      const hoursUntilAdminPurge =
        isDelivered && deliveredAt
          ? Math.max(1, Math.round((ONE_DAY_MS - (Date.now() - deliveredAt)) / (3600 * 1000)))
          : undefined;

      // Nom du compte client (priorité au nom du compte réel)
      const userMessage = chatMessages.find((msg) => msg.clientId === cid && msg.sender === 'user');
      const accountName =
        userMessage?.senderName ||
        matchedOrder?.buyerName ||
        (cid === 'user-karl' ? 'Karl Spero' : `Compte Client ${cid.slice(-4)}`);

      const existing = map.get(cid);

      map.set(cid, {
        clientId: cid,
        name: accountName,
        lastMessage: m.text,
        timestamp: m.timestamp,
        unread: m.sender === 'user' && !m.isAdminReply,
        phone: matchedOrder?.buyerPhone || existing?.phone || '+229 01 00 00 00',
        city: matchedOrder?.shippingAddress || existing?.city || 'Bénin',
        orderCount: orders.filter((o) => o.clientId === cid).length,
        deliveredAt,
        isDelivered: !!isDelivered,
        hoursUntilAdminPurge
      });
    });

    let list = Array.from(map.values());
    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    return list;
  }, [chatMessages, orders, chatSearch]);

  // Client sélectionné dans la discussion (par défaut le premier de la liste s'il existe)
  const currentChatClientId = useMemo(() => {
    if (selectedChatClientId && clientConversations.some((c) => c.clientId === selectedChatClientId)) {
      return selectedChatClientId;
    }
    return clientConversations[0]?.clientId || null;
  }, [selectedChatClientId, clientConversations]);

  const activeChatMessages = useMemo(() => {
    if (!currentChatClientId) return [];
    return chatMessages.filter(
      (m) => (m.clientId || 'visiteur') === currentChatClientId
    );
  }, [chatMessages, currentChatClientId]);

  const selectedClientInfo = useMemo(() => {
    if (!currentChatClientId) return null;
    return clientConversations.find((c) => c.clientId === currentChatClientId) || null;
  }, [clientConversations, currentChatClientId]);

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

  // Enregistrement d'un compte livreur par Login (SANS mot de passe)
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() && !agentLogin.trim()) return;

    let cleanId = agentLogin.trim().toUpperCase();
    if (!cleanId) {
      const cleanZone = agentZone.trim() || 'COTONOU';
      const citySlug = cleanZone.split(/[, -]/)[0].toUpperCase();
      cleanId = `LIVREUR-${citySlug}-${Math.floor(100 + Math.random() * 900)}`;
    } else if (!cleanId.startsWith('LIVREUR-')) {
      cleanId = `LIVREUR-${cleanId}`;
    }

    const cleanZone = agentZone.trim() || 'Cotonou';
    const newAgent: DeliveryAgent = {
      id: cleanId,
      name: agentName.trim() || cleanId,
      phone: agentPhone.trim(),
      zone: cleanZone,
      status: 'active',
      completedDeliveries: 0,
      rating: 5.0,
      joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    onAddDeliveryAgent(newAgent);
    await syncDeliveryAgentToSecureAccount(newAgent);

    setAgentCreationSuccess(
      `Compte livreur pré-enregistré avec succès !\nLogin officiel : ${cleanId}\nLe livreur utilisera désormais ce login pour créer son mot de passe et se connecter.`
    );

    setTimeout(() => {
      setAgentCreationSuccess(null);
      setIsAgentModalOpen(false);
      setAgentLogin('');
      setAgentName('');
      setAgentPhone('');
      setAgentZone('Cotonou (Haie Vive, Cadjèhoun, Fidjrossè)');
    }, 2800);
  };

  // Importation d'image locale (Compatible iPhone iOS, Android, PC) via FileReader Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result as string;
      if (base64Data) {
        setEditingProduct({
          ...editingProduct,
          image: base64Data
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let discountPct = editingProduct.discountPercentage;
    if (editingProduct.originalPrice && editingProduct.originalPrice > editingProduct.price) {
      discountPct = Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100);
    }

    const finalized: Product = {
      ...editingProduct,
      discountPercentage: discountPct,
      promoBadgeText: editingProduct.isPromo
        ? editingProduct.promoBadgeText || (discountPct ? `-${discountPct}% Offre` : 'En Promotion')
        : undefined
    };

    const exists = products.some((p) => p.id === finalized.id);
    if (exists) {
      onUpdateProduct(finalized);
    } else {
      onAddProduct(finalized);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      price: 150000,
      originalPrice: 180000,
      discountPercentage: 17,
      isPromo: false,
      isFeaturedInHero: false,
      promoBadgeText: '-17% Sélection',
      image: '/images/nouvelle-montre.jpg',
      description: 'Pièce authentique d’exception en édition limitée pour le Bénin.',
      category: 'Montres & Horlogerie',
      categorySlug: 'montres',
      inStock: true,
      rating: 5,
      reviewsCount: 1
    });
    setIsProductModalOpen(true);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentChatClientId) return;
    onSendAdminReplyToClient(currentChatClientId, replyText.trim());
    setReplyText('');
  };

  const handleSendQuickCannedReply = (text: string) => {
    if (!currentChatClientId) return;
    onSendAdminReplyToClient(currentChatClientId, text);
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
                Administration YourOrA
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToClientView}
              className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Aperçu Boutique</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3 INDICATEURS CLÉS ESSENTIELS — CHIFFRE D'AFFAIRES CLIQUABLE OUVRANT LE 2ÈME DASHBOARD */}
      <section className="px-4 sm:px-8 pt-5 pb-2">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div
            onClick={() => {
              setActiveTab('orders');
              setOrderFilter('pending');
            }}
            role="button"
            tabIndex={0}
            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-400 transition-all flex items-center gap-3.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Commandes en cours</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{pendingOrdersCount}</p>
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('orders');
              setOrderFilter('delivered');
            }}
            role="button"
            tabIndex={0}
            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-400 transition-all flex items-center gap-3.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Commandes livrées</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{validatedOrdersCount}</p>
            </div>
          </div>

          {/* CARTE CHIFFRE D'AFFAIRES CLIQUABLE : OUVRE LE DEUXIÈME DASHBOARD EN MODAL/DÉDIÉ */}
          <div
            onClick={() => setIsRevenueDashboardOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsRevenueDashboardOpen(true);
              }
            }}
            className="bg-white border-2 border-amber-300 hover:border-amber-500 hover:shadow-md rounded-xl p-4 shadow-xs transition-all flex items-center justify-between gap-3.5 cursor-pointer group"
            title="Cliquez pour ouvrir le 2ème Dashboard Financier (TVA 5%, Commissions Livreurs, Bénéfice Net)"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-800">Chiffre d'affaires livré</p>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                    Ouvrir Détails
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono truncate">
                  {formatFCFA(validatedAmount)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>

        </div>
      </section>

      {/* BARRE D'ONGLETS STRICTE : SANS FINANCE & CHIFFRE D'AFFAIRES */}
      <div className="px-4 sm:px-8 my-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-xs flex items-center gap-1 overflow-x-auto">
            
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Articles & Catalogue</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'products' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {products.length}
              </span>
            </button>

            {/* ONGLET MESSAGERIE ASSISTANCE */}
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-3.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messagerie Assistance</span>
              <span className={`px-2 py-0.2 rounded-full text-[11px] ${
                activeTab === 'messages' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {clientConversations.length}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL SELON L'ONGLET SÉLECTIONNÉ */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pb-10 flex-1">
        
        {/* ======================================================== */}
        {/* ONGLET 1 : COMMANDES                                     */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Recherche & Filtres */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par client, téléphone, adresse, code secret..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    orderFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toutes ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    orderFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  En cours ({pendingOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    orderFilter === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Livrées ({validatedOrdersCount})
                </button>
              </div>
            </div>

            {/* Liste des Commandes */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Aucune commande trouvée</p>
                <p className="text-xs text-slate-500">Les commandes passées par vos clients apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => {
                  const isDelivered = ord.status === 'Livrée';
                  const isIssue = ord.status === 'Litige';
                  const isRefunded = ord.status === 'Remboursée';

                  return (
                    <div
                      key={ord.id}
                      className={`bg-white border rounded-xl p-4 shadow-xs transition-all ${
                        isDelivered
                          ? 'border-emerald-200'
                          : isIssue
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            #{ord.id}
                          </span>
                          <span className="text-xs text-slate-500">{ord.date}</span>
                          
                          {/* Statut Badge */}
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isIssue
                              ? 'bg-rose-100 text-rose-800'
                              : isRefunded
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        {/* Code Secret & Montant */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-xs font-mono">
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-bold text-slate-800">{ord.deliveryCode || 'N/A'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(ord.deliveryCode)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                              title="Copier le code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono font-black text-sm text-slate-900">
                            {formatFCFA(ord.total)}
                          </span>
                        </div>
                      </div>

                      {/* Corps de la commande */}
                      <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        
                        {/* Client & Destination */}
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{ord.buyerName || 'Client'}</p>
                          <p className="text-slate-500 font-mono">{ord.buyerPhone || ord.buyerEmail || 'Contact non renseigné'}</p>
                          <p className="text-slate-600 flex items-start gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{ord.shippingAddress}</span>
                          </p>
                        </div>

                        {/* Articles commandés */}
                        <div className="space-y-1.5">
                          <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wider">
                            Articles ({ord.items.length})
                          </span>
                          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="truncate text-slate-700 font-medium">
                                  {it.quantity}x {it.productName}
                                </span>
                                <span className="font-mono text-slate-900 shrink-0">
                                  {formatFCFA(it.price * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Livreur assigné & Actions rapides */}
                        <div className="space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500 block">
                              Livreur affecté :
                            </label>
                            <select
                              value={ord.assignedDeliveryAgentId || ''}
                              onChange={(e) => onAssignDeliveryAgent(ord.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-slate-800"
                            >
                              <option value="">Sélectionner un livreur...</option>
                              {deliveryAgents.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.name} ({ag.zone})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Statuts modifier */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {!isDelivered && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(ord.id, 'Livrée')}
                                className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Valider livraison
                              </button>
                            )}

                            {isIssue && (
                              <button
                                type="button"
                                onClick={() => onResolveDispute(ord.id, 'release_to_seller')}
                                className="py-1 px-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Résoudre litige
                              </button>
                            )}
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

        {/* ======================================================== */}
        {/* ONGLET 2 : LIVREURS (Gestion & Enregistrement par Login) */}
        {/* ======================================================== */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Flotte des Livreurs Partenaires au Bénin</h3>
                <p className="text-xs text-slate-500">
                  L'admin pré-enregistre les livreurs par leur <strong>login officiel</strong> (sans mot de passe). Le livreur crée ensuite son mot de passe avec ce même login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(true)}
                className="py-2 px-3.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Enregistrer un livreur</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryAgents.map((ag) => (
                <div
                  key={ag.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 font-bold text-sm flex items-center justify-center">
                          {ag.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{ag.name}</h4>
                          <span className="text-[11px] font-mono text-slate-500">{ag.id}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {ag.status === 'active' ? 'Actif' : ag.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Zone : <strong>{ag.zone}</strong></span>
                      </p>
                      {ag.phone && (
                        <p className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ag.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {ag.completedDeliveries} course{ag.completedDeliveries > 1 ? 's' : ''} livrée{ag.completedDeliveries > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAgentDetails(ag)}
                      className="text-slate-900 font-bold hover:underline cursor-pointer"
                    >
                      Détails →
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : ARTICLES & CATALOGUE (Description, Promo...)   */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catalogue des Pièces d'Exception</h3>
                <p className="text-xs text-slate-500">
                  Ajoutez vos articles avec description personnalisée, promotions (prix barré), mise en défilé carrousel et photo importée.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="py-2 px-3.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Ajouter un article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 bg-slate-100 overflow-hidden group">
                      <img
                        src={getAssetUrl(prod.image)}
                        alt={prod.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Badges promo & Défilé */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        {prod.isPromo && (
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            {prod.promoBadgeText || `-${prod.discountPercentage || 15}%`}
                          </span>
                        )}
                        {prod.isFeaturedInHero && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>En défilé</span>
                          </span>
                        )}
                      </div>

                      {/* Action toggle défilé */}
                      <button
                        type="button"
                        onClick={() => onToggleHeroFeature(prod.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-colors cursor-pointer ${
                          prod.isFeaturedInHero
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/90 text-slate-600 hover:text-slate-900'
                        }`}
                        title={prod.isFeaturedInHero ? 'Retirer du défilé carrousel' : 'Ajouter au défilé carrousel'}
                      >
                        <Star className={`w-3.5 h-3.5 ${prod.isFeaturedInHero ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="pt-2 flex items-baseline gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatFCFA(prod.price)}
                        </span>
                        {prod.originalPrice && prod.originalPrice > prod.price && (
                          <span className="font-mono text-xs text-slate-400 line-through">
                            {formatFCFA(prod.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(prod);
                        setIsProductModalOpen(true);
                      }}
                      className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Supprimer l'article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 4 : MESSAGERIE ASSISTANCE                         */}
        {/* RÈGLE : Seuls les clients qui ont écrit apparaissent !   */}
        {/* ======================================================== */}
        {activeTab === 'messages' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[620px] animate-in fade-in">
            
            {/* Panneau Gauche : Liste des discussions clients (WhatsApp Web style) */}
            <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
              
              {/* Header liste */}
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                    💬
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Discussions Clients</h3>
                    <p className="text-[10px] text-slate-400">Clients ayant écrit à l'assistance</p>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {clientConversations.length} compte{clientConversations.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Recherche client */}
              <div className="p-2.5 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher par compte client..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Liste scrollable des conversations */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {clientConversations.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-2 text-xs">
                    <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">Aucun message pour l'instant</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Dès qu'un client ayant payé une commande (ex: Ata, Assoude) écrit à l'assistance, son compte apparaîtra automatiquement ici pour que vous puissiez lui répondre.
                    </p>
                  </div>
                ) : (
                  clientConversations.map((client) => {
                    const isSelected = client.clientId === currentChatClientId;
                    return (
                      <div
                        key={client.clientId}
                        onClick={() => setSelectedChatClientId(client.clientId)}
                        role="button"
                        tabIndex={0}
                        className={`p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                            : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-300 font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={`text-xs truncate ${isSelected ? 'font-bold text-emerald-950' : 'font-semibold text-slate-900'}`}>
                              {client.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {client.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate leading-snug">
                            {client.lastMessage}
                          </p>
                          
                          {/* Badge compte à rebours 1 jour côté admin */}
                          {client.isDelivered && client.hoursUntilAdminPurge !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono mt-1 border border-amber-200">
                              <Timer className="w-2.5 h-2.5" />
                              <span>Livré • Purge auto dans {client.hoursUntilAdminPurge}h</span>
                            </span>
                          )}
                        </div>

                        {client.unread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Panneau Droit : Fil de discussion Messenger / WhatsApp */}
            <div className="flex-1 flex flex-col bg-[#F0F2F5] min-w-0">
              
              {selectedClientInfo ? (
                <>
                  {/* En-tête de la discussion sélectionnée */}
                  <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0">
                        {selectedClientInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {selectedClientInfo.name}
                        </h4>
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{selectedClientInfo.city} • {selectedClientInfo.phone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedClientInfo.phone && (
                        <a
                          href={`tel:${selectedClientInfo.phone}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Appeler le client"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        Compte: {selectedClientInfo.clientId}
                      </span>
                    </div>
                  </div>

                  {/* Zone des messages (style WhatsApp / Messenger bubbles) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFEAE2]/60">
                    {activeChatMessages.map((msg) => {
                      const isAdmin = msg.sender === 'admin' || msg.isAdminReply;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-xs relative ${
                              isAdmin
                                ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs'
                                : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-0.5 text-[10px] font-semibold text-slate-600">
                              <span>{isAdmin ? '👑 Vous (OrA Admin)' : msg.senderName}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-line text-xs">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                              <span>{msg.timestamp}</span>
                              {isAdmin && <CheckCheck className="w-3 h-3 text-blue-500" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Réponses rapides en 1 clic */}
                  <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                      Réponses rapides :
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSendQuickCannedReply('Bonjour ! Votre commande est bien confirmée et en cours de préparation.')}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                    >
                      📦 En préparation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendQuickCannedReply('Votre coursier est en route avec votre colis.')}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                    >
                      🛵 En route
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendQuickCannedReply('Paiement Mobile Money bien réceptionné sous séquestre.')}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                    >
                      💳 Paiement validé
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendQuickCannedReply('Avez-vous besoin d’une précision sur votre livraison ?')}
                      className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors"
                    >
                      🤝 Précision
                    </button>
                  </div>

                  {/* Barre de saisie style Messenger */}
                  <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Répondre à ${selectedClientInfo.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2 bg-slate-100 border-none rounded-xl focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs"
                      aria-label="Envoyer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-12 h-12 text-slate-300 stroke-1" />
                  <p className="text-sm font-semibold text-slate-600">Aucune discussion sélectionnée</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Les discussions apparaissent ici dès qu'un client ayant payé vous envoie un message.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 2ÈME DASHBOARD FINANCIER COMPLET : MODAL GRAND FORMAT    */}
      {/* (Accessible UNIQUEMENT au clic sur le Chiffre d'affaires) */}
      {/* ======================================================== */}
      {isRevenueDashboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
            
            {/* Header du 2ème Dashboard */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                  <PieChart className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                      Deuxième Dashboard : Clôture & Répartition Financière
                    </h2>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                      Bénin (FCFA)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Répartition du chiffre d'affaires sur {validatedOrdersCount} commande{validatedOrdersCount > 1 ? 's' : ''} livrée{validatedOrdersCount > 1 ? 's' : ''} (TVA 5%, barème courses livreurs & bénéfice net)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Imprimer ou enregistrer le relevé financier en PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRevenueDashboardOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fermer le 2ème Dashboard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps scrollable du 2ème Dashboard */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* 4 PÔLES FINANCIERS CLÉS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* CA Brut */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                      <span>Chiffre d'Affaires Brut</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">100%</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-slate-900 tracking-tight mt-1">
                      {formatFCFA(validatedAmount)}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    Total des ventes encaissées sur les commandes livrées
                  </p>
                </div>

                {/* TVA 5% */}
                <div className="bg-white border-2 border-rose-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        TVA (5%)
                      </span>
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">5% Fixe</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-rose-600 tracking-tight mt-1">
                      {formatFCFA(financialBreakdown.tva)}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    Part réservée pour obligations fiscales au Bénin
                  </p>
                </div>

                {/* Commissions Livreurs */}
                <div className="bg-white border-2 border-blue-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Commissions Livreurs
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Courses</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-blue-600 tracking-tight mt-1">
                      {formatFCFA(financialBreakdown.deliveryCommissions)}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    Total reversé aux livreurs selon la destination
                  </p>
                </div>

                {/* Marge Nette YourOrA */}
                <div className="bg-emerald-950 text-white rounded-2xl p-4.5 shadow-sm border-2 border-emerald-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Bénéfice Net OrA
                      </span>
                      <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">Net Final</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-amber-300 tracking-tight mt-1">
                      {formatFCFA(financialBreakdown.netAmount)}
                    </p>
                  </div>
                  <p className="text-[11px] text-emerald-300 mt-2 pt-2 border-t border-emerald-800/80">
                    Solde net restant après TVA et courses de livraison
                  </p>
                </div>

              </div>

              {/* BARRE ANALYTIQUE DE VENTILATION VISUELLE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ventilation Graphique du Chiffre d'Affaires
                </span>

                <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
                  <div
                    style={{
                      width: `${validatedAmount > 0 ? (financialBreakdown.netAmount / validatedAmount) * 100 : 80}%`
                    }}
                    className="bg-emerald-600 h-full rounded-l-full transition-all"
                    title="Part Nette OrA"
                  />
                  <div
                    style={{
                      width: `${validatedAmount > 0 ? (financialBreakdown.tva / validatedAmount) * 100 : 5}%`
                    }}
                    className="bg-rose-500 h-full transition-all"
                    title="TVA 5%"
                  />
                  <div
                    style={{
                      width: `${validatedAmount > 0 ? (financialBreakdown.deliveryCommissions / validatedAmount) * 100 : 15}%`
                    }}
                    className="bg-blue-500 h-full rounded-r-full transition-all"
                    title="Commissions Livreurs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                    <span className="text-slate-700 font-medium">Boutique Net : <strong className="font-mono text-emerald-800">{formatFCFA(financialBreakdown.netAmount)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="text-slate-700 font-medium">TVA 5% : <strong className="font-mono text-rose-700">{formatFCFA(financialBreakdown.tva)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    <span className="text-slate-700 font-medium">Commissions Livreurs : <strong className="font-mono text-blue-700">{formatFCFA(financialBreakdown.deliveryCommissions)}</strong></span>
                  </div>
                </div>
              </div>

              {/* GRILLE DU BARÈME DES COURSES LIVREURS */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Barème Officiel des Commissions selon la Zone
                      </h3>
                      <p className="text-xs text-slate-500">
                        Application automatique selon l'adresse de destination
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    Total : {formatFCFA(financialBreakdown.deliveryCommissions)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Zone 1 : Cotonou */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-center space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Courses dans Cotonou</span>
                    <p className="text-xl font-black font-mono text-slate-900">500 FCFA</p>
                    <p className="text-[11px] text-slate-500">Haie Vive, Cadjèhoun, Fidjrossè...</p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                        {financialBreakdown.cotonouCourses} course{financialBreakdown.cotonouCourses > 1 ? 's' : ''} = {formatFCFA(financialBreakdown.cotonouCourses * 500)}
                      </span>
                    </div>
                  </div>

                  {/* Zone 2 : Calavi & Godomey */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-center space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Calavi / Godomey</span>
                    <p className="text-xl font-black font-mono text-slate-900">800 FCFA</p>
                    <p className="text-[11px] text-slate-500">Abomey-Calavi, Godomey, Tankpè...</p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                        {financialBreakdown.calaviGodomeyCourses} course{financialBreakdown.calaviGodomeyCourses > 1 ? 's' : ''} = {formatFCFA(financialBreakdown.calaviGodomeyCourses * 800)}
                      </span>
                    </div>
                  </div>

                  {/* Zone 3 : Plus loin */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-center space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">Plus Loin</span>
                    <p className="text-xl font-black font-mono text-slate-900">1 000 FCFA</p>
                    <p className="text-[11px] text-slate-500">Porto-Novo, Ouidah & Environs</p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                        {financialBreakdown.plusLoinCourses} course{financialBreakdown.plusLoinCourses > 1 ? 's' : ''} = {formatFCFA(financialBreakdown.plusLoinCourses * 1000)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* GRAND TABLEAU ANALYTIQUE COMMANDE PAR COMMANDE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Grand Livre des Ventes & Répartitions
                    </h3>
                    <p className="text-xs text-slate-500">
                      Détail ligne par ligne : montant brut, TVA 5%, commission livreur et net boutique
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {deliveredOrders.length} opération{deliveredOrders.length > 1 ? 's' : ''}
                  </span>
                </div>

                {deliveredOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                    Aucune commande n'est encore marquée comme livrée.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">N° Commande</th>
                          <th className="py-2.5 px-3">Client</th>
                          <th className="py-2.5 px-3">Destination</th>
                          <th className="py-2.5 px-3 text-right">CA Brut</th>
                          <th className="py-2.5 px-3 text-right text-rose-600">TVA (5%)</th>
                          <th className="py-2.5 px-3 text-right text-blue-600">Livreur</th>
                          <th className="py-2.5 px-3 text-right text-emerald-700">Net OrA</th>
                          <th className="py-2.5 px-3">Livreur Assigné</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financialBreakdown.detailedCourses.map((item) => (
                          <tr key={item.order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              #{item.order.id}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800 block">{item.order.buyerName || 'Client'}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-medium text-slate-700 block truncate max-w-[150px]">{item.order.shippingAddress}</span>
                              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-semibold inline-block">
                                {item.zoneName}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatFCFA(item.order.total)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                              -{formatFCFA(item.tva)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-blue-600">
                              -{formatFCFA(item.commission)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                              {formatFCFA(item.net)}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.order.assignedDeliveryAgentName || 'Livreur flotte'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Pied du 2ème Dashboard */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Clôture automatique synchronisée avec les validations de remise
              </span>
              <button
                type="button"
                onClick={() => setIsRevenueDashboardOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fermer le tableau
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : AJOUT LIVREUR PAR LOGIN SANS MOT DE PASSE        */}
      {/* ======================================================== */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Enregistrer un Compte Livreur</h3>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {agentCreationSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enregistrement validé</span>
                </div>
                <p className="whitespace-pre-line text-[11px] text-emerald-800">
                  {agentCreationSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
                
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                  ℹ️ L'admin enregistre le coursier par son <strong>login</strong> sans mot de passe. Le livreur créera son mot de passe lors de sa première connexion avec ce même login.
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Login / Identifiant du livreur (ex: LIVREUR-PAUL)
                  </label>
                  <input
                    type="text"
                    value={agentLogin}
                    onChange={(e) => setAgentLogin(e.target.value.toUpperCase())}
                    placeholder="ex: LIVREUR-MARC ou LIVREUR-COTONOU"
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:border-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    (Le préfixe LIVREUR- sera automatiquement ajouté s'il est omis)
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nom du coursier</label>
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
                  <label className="font-semibold text-slate-700 block mb-1">Téléphone de contact</label>
                  <input
                    type="tel"
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                    placeholder="ex: +229 01 97 00 12 34"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Zone de livraison habituelle</label>
                  <select
                    value={agentZone}
                    onChange={(e) => setAgentZone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                  >
                    <option value="Cotonou (Haie Vive, Cadjèhoun, Fidjrossè)">Cotonou (Course 500 FCFA)</option>
                    <option value="Abomey-Calavi & Godomey">Abomey-Calavi & Godomey (Course 800 FCFA)</option>
                    <option value="Porto-Novo, Ouidah & Environs">Porto-Novo / Plus loin (Course 1 000 FCFA)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAgentModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors cursor-pointer"
                  >
                    Enregistrer le login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : PRODUIT (DESCRIPTION, PROMO, PRIX BARRÉ...)      */}
      {/* ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {products.some((p) => p.id === editingProduct.id) ? 'Modifier l’article' : 'Ajouter un article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              
              {/* Nom & Catégorie */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nom de l'article</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                    placeholder="ex: Chronographe Automatique OrA"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Catégorie</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        category: cat,
                        categorySlug: cat.toLowerCase().includes('parfum') ? 'parfums' : 'montres'
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800"
                  >
                    <option value="Montres & Horlogerie">Montres & Horlogerie</option>
                    <option value="Haute Parfumerie">Haute Parfumerie</option>
                  </select>
                </div>
              </div>

              {/* Description personnalisée voulue par l'admin */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Description personnalisée de l'article
                </label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  placeholder="Rédigez la description souhaitée : matériaux nobles, notes de tête, finitions..."
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800 leading-relaxed"
                />
              </div>

              {/* Prix de vente & Prix barré promotionnel */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Prix de vente (FCFA)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Prix d'origine (Prix barré)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    placeholder="Optionnel"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Options Promotion & Défilé Carrousel */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.isPromo}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPromo: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-0"
                    />
                    <span>Activer la Promotion (Badge & Prix barré)</span>
                  </label>

                  {editingProduct.isPromo && (
                    <input
                      type="text"
                      value={editingProduct.promoBadgeText || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, promoBadgeText: e.target.value })}
                      placeholder="ex: -20% Sélection"
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-bold w-28 text-right"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editingProduct.isFeaturedInHero}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isFeaturedInHero: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-0"
                    />
                    <span>Mettre en défilé sur la page d'accueil (Bannière Carrousel)</span>
                  </label>
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                </div>
              </div>

              {/* Importation de Photo (Bouton simple, compatible iPhone / iPad / Android / Mac / PC) */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Photo de l'article
                </label>

                {/* Input fichier universel : accept="image/*" ouvre nativement la photothèque iPhone / fichiers */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choisir une photo</span>
                  </button>
                </div>

                {/* Saisie textuelle ou chemin si souhaité */}
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="/images/nouvelle-montre.jpg"
                  required
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-800 font-mono text-[11px]"
                />

                {/* Aperçu immédiat de la photo */}
                {editingProduct.image && (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <img
                      src={getAssetUrl(editingProduct.image)}
                      alt="Aperçu"
                      className="w-12 h-12 object-cover rounded-md border border-slate-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-800 block">
                        Aperçu de la photo
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {editingProduct.image.startsWith('data:') ? 'Photo importée depuis votre stockage' : editingProduct.image}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Enregistrer l'article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fiche Détails Livreur */}
      {selectedAgentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Fiche Livreur</h3>
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
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
                <p className="text-xs text-slate-500 font-mono font-medium truncate">
                  {selectedAgentDetails.id}
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
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
