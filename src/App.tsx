/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CheckoutPage } from './components/CheckoutPage';
import { ProfileDrawer } from './components/ProfileDrawer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { DeliveryPortal } from './components/DeliveryPortal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { Toast } from './components/Toast';
import { PRODUCTS } from './data/products';
import { Product, CartItem, UserProfile, Order, SavedMobileMoney, ChatMessage, DeliveryAgent, DeliveryNotification } from './types';
import { formatFCFA } from './utils/formatCurrency';
import { getAssetUrl } from './utils/imageUtils';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getSavedDeliveryNotifications, saveDeliveryNotifications, playDeliveryChime, showSystemNotification } from './utils/deliveryNotifications';
import { WifiOff, Eye, ArrowLeft } from 'lucide-react';

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Invité',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  role: 'guest',
  isAdmin: false
};

const INITIAL_DELIVERY_AGENTS: DeliveryAgent[] = [
  {
    id: 'LIVREUR-COTONOU',
    name: 'Marc Dossou',
    phone: '+229 01 97 12 34 56',
    zone: 'Cotonou (Haie Vive, Cadjèhoun, Fidjrossè)',
    status: 'active',
    completedDeliveries: 18,
    rating: 4.9,
    joinedDate: '15 Janvier 2026'
  },
  {
    id: 'LIVREUR-CALAVI',
    name: 'Roland Houessou',
    phone: '+229 01 96 45 67 89',
    zone: 'Abomey-Calavi & Godomey',
    status: 'active',
    completedDeliveries: 24,
    rating: 5.0,
    joinedDate: '02 Février 2026'
  },
  {
    id: 'LIVREUR-PORTO-NOVO',
    name: 'Aurel Tossou',
    phone: '+229 01 95 23 45 67',
    zone: 'Porto-Novo & Akpakpa',
    status: 'active',
    completedDeliveries: 12,
    rating: 4.8,
    joinedDate: '20 Février 2026'
  }
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-karl',
    clientId: 'user-karl',
    sender: 'concierge',
    senderName: 'Conciergerie YourOrA',
    text: 'Bonjour Karl Spero. Votre commande d’horlogerie a bien été enregistrée et transmise à notre atelier.',
    timestamp: '10:00'
  },
  {
    id: 'msg-karl-1',
    clientId: 'user-karl',
    sender: 'user',
    senderName: 'Karl Spero',
    text: 'Bonjour, ma montre automatique est-elle prête pour livraison à la Haie Vive ?',
    timestamp: '10:15'
  },
  {
    id: 'msg-reply-1',
    clientId: 'user-karl',
    sender: 'admin',
    senderName: '👑 Administrateur YourOrA',
    text: 'Bonjour M. Spero. Votre colis est conditionné dans son écrin de luxe et remis à notre coursier. Le code secret vous sera demandé à la remise.',
    timestamp: '10:20',
    isAdminReply: true
  },
  {
    id: 'msg-client-2',
    clientId: 'cli-calavi-402',
    sender: 'user',
    senderName: 'Mireille Tossou',
    text: 'Bonjour, le paiement Moov Money est-il bien validé pour mon flacon de Santal & Ambre ?',
    timestamp: '11:05'
  },
  {
    id: 'msg-reply-2',
    clientId: 'cli-calavi-402',
    sender: 'admin',
    senderName: '👑 Administrateur YourOrA',
    text: 'Bonjour Mme Tossou. Votre paiement sous séquestre a bien été confirmé par FedaPay. La livraison à Abomey-Calavi est programmée pour cet après-midi.',
    timestamp: '11:10',
    isAdminReply: true
  }
];

export default function App() {
  const isOnline = useOnlineStatus();

  // Navigation / View state: 'catalog' | 'checkout' | 'admin' | 'delivery'
  const [currentView, setCurrentView] = useState<'catalog' | 'checkout' | 'admin' | 'delivery'>('catalog');
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<Product | null>(null);

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<'checkout' | 'manual' | null>(null);
  const [pendingCheckoutAction, setPendingCheckoutAction] = useState<Product | 'cart' | null>(null);
  const [isClientPreviewMode, setIsClientPreviewMode] = useState(false);
  const [detailModalProduct, setDetailModalProduct] = useState<Product | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dynamic products list (Admin can add/edit/delete/toggle hero in real-time)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('ora_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // Ensure image paths are updated to valid relative / clean paths
        return parsed.map((p) => {
          if (p.image?.startsWith('/src/assets/images/')) {
            return { ...p, image: p.image.replace('/src/assets/images/', '/images/') };
          }
          return p;
        });
      }
      // Initialize first 3 as featured in hero
      return PRODUCTS.map((p, idx) => ({
        ...p,
        isFeaturedInHero: idx < 3
      }));
    } catch {
      return PRODUCTS;
    }
  });

  // Cart state persisted
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ora_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Profile: Default is GUEST as requested ("Au tout abord, si on monte dessus on est un invité")
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ora_user_session');
      if (saved) {
        return JSON.parse(saved);
      }
      return GUEST_PROFILE;
    } catch {
      return GUEST_PROFILE;
    }
  });

  // Orders persisted (Starts strictly with 0 orders)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('ora_orders');
      if (saved) {
        const parsed: Order[] = JSON.parse(saved);
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Support duration hours (Default: 24h, can be customized by Admin per conversation)
  const [supportDurationHours, setSupportDurationHours] = useState<number>(24);

  // Chat messages persisted
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ora_chat_messages');
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  // Delivery Agents fleet in Benin
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>(() => {
    try {
      const saved = localStorage.getItem('ora_delivery_agents');
      return saved ? JSON.parse(saved) : INITIAL_DELIVERY_AGENTS;
    } catch {
      return INITIAL_DELIVERY_AGENTS;
    }
  });

  const [currentDeliveryAgentId, setCurrentDeliveryAgentId] = useState<string>('LIVREUR-COTONOU');

  const currentDeliveryAgent = useMemo(() => {
    return (
      deliveryAgents.find((a) => a.id === currentDeliveryAgentId) ||
      deliveryAgents[0] ||
      INITIAL_DELIVERY_AGENTS[0]
    );
  }, [deliveryAgents, currentDeliveryAgentId]);

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('ora_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ora_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('ora_user_session', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('ora_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ora_delivery_agents', JSON.stringify(deliveryAgents));
  }, [deliveryAgents]);

  useEffect(() => {
    localStorage.setItem('ora_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Delivery Notifications for couriers
  const [deliveryNotifications, setDeliveryNotifications] = useState<DeliveryNotification[]>(() => {
    return getSavedDeliveryNotifications();
  });

  useEffect(() => {
    saveDeliveryNotifications(deliveryNotifications);
  }, [deliveryNotifications]);

  const handleMarkNotificationRead = (notifId: string) => {
    setDeliveryNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setDeliveryNotifications([]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`« ${product.name} » ajouté au panier`);
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Requirement: "pour payer il faut s'authentifier"
  const isGuest = userProfile.role === 'guest' || userProfile.name === 'Invité';

  const handleDirectCheckout = (product: Product) => {
    if (isGuest) {
      setPendingCheckoutAction(product);
      setAuthReason('checkout');
      setIsAuthOpen(true);
      return;
    }
    setSelectedCheckoutProduct(product);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedCartCheckout = () => {
    if (isGuest) {
      setPendingCheckoutAction('cart');
      setAuthReason('checkout');
      setIsAuthOpen(true);
      return;
    }
    setSelectedCheckoutProduct(null);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Success Handler
  const handleLoginSuccess = (user: UserProfile, isAdminLogin?: boolean, isDeliveryLogin?: boolean) => {
    setUserProfile(user);

    if (isDeliveryLogin || user.role === 'delivery') {
      const targetAgentId = (user.deliveryAgentId || user.id || 'LIVREUR-COTONOU').toUpperCase();
      
      setDeliveryAgents((prev) => {
        const found = prev.find((a) => a.id.toUpperCase() === targetAgentId);
        if (found) return prev;

        const zonePart = targetAgentId.replace(/^LIVREUR-/i, '').replace(/[-_]/g, ' ') || 'Cotonou';
        const formattedZone = zonePart.charAt(0).toUpperCase() + zonePart.slice(1).toLowerCase();

        const createdAgent: DeliveryAgent = {
          id: targetAgentId,
          name: user.name || `Livreur (${formattedZone})`,
          phone: user.phone || '+229 01 97 00 00 00',
          zone: formattedZone,
          status: 'active',
          completedDeliveries: 0,
          rating: 5.0,
          joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        };
        return [...prev, createdAgent];
      });

      setCurrentDeliveryAgentId(targetAgentId);
      setCurrentView('delivery');
      setIsClientPreviewMode(false);
      showToast(`Connexion Espace Livreur : ${user.name}`);
      return;
    }

    if (isAdminLogin || user.isAdmin) {
      setCurrentView('admin');
      setIsClientPreviewMode(false);
      showToast(`Connexion Administrateur ${user.id || ''} validée`);
      return;
    }

    showToast(`Bienvenue, ${user.name} !`);

    // If there was a pending checkout action, fulfill it immediately
    if (pendingCheckoutAction) {
      if (pendingCheckoutAction === 'cart') {
        setSelectedCheckoutProduct(null);
      } else {
        setSelectedCheckoutProduct(pendingCheckoutAction);
      }
      setPendingCheckoutAction(null);
      setCurrentView('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    setUserProfile(GUEST_PROFILE);
    localStorage.removeItem('ora_user_session');
    setCurrentView('catalog');
    setIsClientPreviewMode(false);
    showToast('Vous êtes désormais en mode Invité');
  };

  const handleSaveMobileMoney = (newMM: SavedMobileMoney) => {
    setUserProfile((prev) => ({
      ...prev,
      savedMobileMoney: newMM
    }));
    showToast(`Numéro ${newMM.operator} Bénin (${newMM.phoneNumber}) enregistré`);
  };

  const handleOrderComplete = (newOrder: Order) => {
    // Enrich order with client ID and current timestamp
    const enrichedOrder: Order = {
      ...newOrder,
      clientId: userProfile.id || `client-${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'anonyme'}`,
      createdAt: Date.now(),
      buyerName: userProfile.name,
      buyerEmail: userProfile.email,
      buyerPhone: userProfile.phone
    };

    setOrders((prev) => [enrichedOrder, ...prev]);
    if (!selectedCheckoutProduct) {
      setCartItems([]);
    }
    showToast(`Commande #${newOrder.id} validée. Assistance active pendant 24h.`);
  };

  // Commandes payées pour le client connecté (ou invité ayant payé)
  const paidOrdersForCurrentClient = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.clientId === userProfile.id ||
          (userProfile.email && o.buyerEmail === userProfile.email) ||
          (userProfile.phone && o.buyerPhone === userProfile.phone)) &&
        o.status !== 'Remboursée'
    );
  }, [orders, userProfile]);

  // Suppression définitive des messages d'un client (ex: 30 min après livraison validée)
  const handleClearClientMessages = (clientId: string) => {
    setChatMessages((prev) => prev.filter((m) => (m.clientId || 'guest') !== clientId));
  };

  // Admin Actions for Products & Hero Carousel
  const handleAdminAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Nouvel article « ${newProd.name} » publié`);
  };

  const handleAdminUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Article « ${updated.name} » mis à jour`);
  };

  const handleAdminDeleteProduct = (prodId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
    showToast('Article retiré du catalogue');
  };

  // Toggle whether product is featured in Hero Carousel
  const handleToggleHeroFeature = (prodId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          const nextVal = !p.isFeaturedInHero;
          showToast(
            nextVal
              ? `« ${p.name} » ajouté à la bannière défilante`
              : `« ${p.name} » retiré de la bannière défilante`
          );
          return { ...p, isFeaturedInHero: nextVal };
        }
        return p;
      })
    );
  };

  const handleAdminUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const isNowDelivered = status === 'Livrée';
          return {
            ...o,
            status,
            deliveredAt: isNowDelivered ? (o.deliveredAt || Date.now()) : o.deliveredAt,
            escrowStatus: isNowDelivered ? 'released' : o.escrowStatus
          };
        }
        return o;
      })
    );
    showToast(`Statut commande #${orderId} : ${status}`);
  };

  const handleAssignDeliveryAgent = (orderId: string, agentId: string) => {
    const agent = deliveryAgents.find((a) => a.id === agentId);
    const agentName = agent ? agent.name : undefined;
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newTimeline = [
            ...(o.timeline || []),
            {
              id: `evt-${Date.now()}`,
              timestamp: Date.now(),
              action: agentName ? `Commande affectée au livreur ${agentName}` : 'Désaffectation du livreur',
              actor: 'Admin',
              details: agent ? `Zone : ${agent.zone}` : undefined
            }
          ];
          return {
            ...o,
            assignedDeliveryAgentId: agentId || undefined,
            assignedDeliveryAgentName: agentName,
            status: o.status === 'Confirmée' || o.status === 'En préparation' ? 'Expédiée' : o.status,
            timeline: newTimeline
          };
        }
        return o;
      })
    );

    // Trigger local courier notification with sound chime
    if (agentId && agent && targetOrder) {
      const newNotif: DeliveryNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        agentId: agent.id,
        orderId: targetOrder.id,
        orderNumber: targetOrder.id,
        customerName: targetOrder.buyerName || 'Client OrA',
        shippingAddress: targetOrder.shippingAddress,
        amount: targetOrder.total,
        timestamp: Date.now(),
        read: false,
        message: `Nouvelle course : Commande #${targetOrder.id} à livrer à ${targetOrder.shippingAddress}`
      };
      setDeliveryNotifications((prev) => [newNotif, ...prev]);

      // Play local Web Audio chime
      playDeliveryChime();

      // Show system desktop notification if permitted
      showSystemNotification(
        '📦 Nouvelle course assignée !',
        `${agent.name}, la commande #${targetOrder.id} (${targetOrder.shippingAddress}) vous a été attribuée.`
      );
    }

    showToast(agentName ? `Livreur ${agentName} affecté à la commande #${orderId}` : `Livreur retiré de la commande #${orderId}`);
  };

  const handleResolveDispute = (orderId: string, resolution: 'release_to_seller' | 'refund_to_buyer') => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          if (resolution === 'release_to_seller') {
            return {
              ...o,
              status: 'Livrée',
              escrowStatus: 'released',
              deliveredAt: Date.now(),
              timeline: [
                ...(o.timeline || []),
                {
                  id: `evt-${Date.now()}`,
                  timestamp: Date.now(),
                  action: 'Confirmation Admin : Validation de la livraison',
                  actor: 'Admin',
                  details: 'Livraison confirmée par l’administration.'
                }
              ]
            };
          } else {
            return {
              ...o,
              status: 'Remboursée',
              escrowStatus: 'refunded',
              timeline: [
                ...(o.timeline || []),
                {
                  id: `evt-${Date.now()}`,
                  timestamp: Date.now(),
                  action: 'Remboursement client validé par l’administration',
                  actor: 'Admin',
                  details: 'Fonds retournés au compte Mobile Money du client.'
                }
              ]
            };
          }
        }
        return o;
      })
    );
    showToast(
      resolution === 'release_to_seller'
        ? `Commande #${orderId} validée et encaissée.`
        : `Commande #${orderId} remboursée au client.`
    );
  };

  const handleAddDeliveryAgent = (newAgent: DeliveryAgent) => {
    setDeliveryAgents((prev) => [...prev, newAgent]);
    showToast(`Nouveau livreur « ${newAgent.name} » ajouté`);
  };

  const handleVerifyDeliveryCode = (orderId: string, enteredCode: string): { success: boolean; message: string } => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Commande introuvable dans le système.' };
    }

    const cleanEntered = enteredCode.trim().toUpperCase();
    const cleanActual = (order.deliveryCode || '').trim().toUpperCase();

    if (cleanEntered === cleanActual) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            const updatedTimeline = [
              ...(o.timeline || []),
              {
                id: `evt-${Date.now()}-1`,
                timestamp: Date.now(),
                action: `Code secret validé (${cleanEntered})`,
                actor: `Livreur (${currentDeliveryAgent.name})`,
                details: 'Colis remis en main propre au client.'
              },
              {
                id: `evt-${Date.now()}-2`,
                timestamp: Date.now() + 1,
                action: `Fonds libérés au vendeur (${formatFCFA(o.total)})`,
                actor: 'Passerelle FedaPay',
                details: 'Statut séquestre : Libéré (RELEASED)'
              }
            ];
            return {
              ...o,
              status: 'Livrée',
              escrowStatus: 'released',
              deliveredAt: Date.now(),
              timeline: updatedTimeline
            };
          }
          return o;
        })
      );

      // Increment completed deliveries for this agent
      setDeliveryAgents((prev) =>
        prev.map((ag) =>
          ag.id === currentDeliveryAgent.id
            ? { ...ag, completedDeliveries: ag.completedDeliveries + 1 }
            : ag
        )
      );

      showToast(`Livraison #${orderId} validée ! Paiement débloqué.`);
      return { success: true, message: 'Code certifié ! Remise validée et fonds débloqués avec succès.' };
    } else {
      return {
        success: false,
        message: 'Code erroné ! Le code fourni par le client ne correspond pas à cette commande.'
      };
    }
  };

  const handleReportDeliveryIssue = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'Litige',
            escrowStatus: 'disputed',
            disputeReason: reason,
            timeline: [
              ...(o.timeline || []),
              {
                id: `evt-${Date.now()}`,
                timestamp: Date.now(),
                action: `Empêchement de remise : ${reason}`,
                actor: `Livreur (${currentDeliveryAgent.name})`,
                details: 'Livraison reportée en attente de nouvelle instruction.'
              }
            ]
          };
        }
        return o;
      })
    );
    showToast(`Empêchement consigné pour la commande #${orderId}.`);
  };

  // Chat Actions with Client Segregation
  const handleSendMessage = (text: string) => {
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId: userProfile.id,
      sender: userProfile.isAdmin ? 'admin' : 'user',
      senderName: userProfile.name || 'Client',
      text,
      timestamp: timeNow,
      isAdminReply: userProfile.isAdmin
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Helpful instant concierge response if admin isn't responding immediately
    if (!userProfile.isAdmin) {
      setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = "Votre conseiller OrA a bien reçu votre demande et vous répondra dans les plus brefs délais.";
        if (lower.includes('momo') || lower.includes('mtn') || lower.includes('moov') || lower.includes('celtiis') || lower.includes('payer') || lower.includes('paiement') || lower.includes('feda')) {
          reply = "Les paiements s'effectuent rapidement via la passerelle FedaPay par MTN MoMo, Moov Money ou Celtiis Cash Bénin.";
        } else if (lower.includes('livraison') || lower.includes('délai')) {
          reply = "Votre commande est préparée immédiatement dès validation et livrée sous 24 à 48 heures.";
        }

        const autoMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          clientId: userProfile.id,
          sender: 'concierge',
          senderName: 'Conciergerie OrA',
          text: reply,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => [...prev, autoMsg]);
      }, 800);
    }
  };

  const handleSendAdminReplyToClient = (clientId: string, text: string) => {
    const timeNow = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const adminMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId: clientId,
      sender: 'admin',
      senderName: '👑 Administrateur OrA',
      text,
      timestamp: timeNow,
      isAdminReply: true
    };
    setChatMessages((prev) => [...prev, adminMsg]);
    showToast('Réponse envoyée au client');
  };

  const handleSetClientSupportDuration = (clientId: string, hours: number) => {
    setSupportDurationHours(hours);
    showToast(`Durée d'assistance fixée à ${hours} heures pour ce client`);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory === 'promo' && !product.isPromo) {
        return false;
      }
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'promo' &&
        product.categorySlug !== selectedCategory
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Product counts
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      promo: products.filter((p) => p.isPromo).length
    };
    products.forEach((p) => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
  }, [products]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // If current view is 'admin', render the FULL PAGE Admin Dashboard:
  // If current view is 'admin', render the FULL PAGE Admin Dashboard:
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col antialiased">
        <AdminDashboard
          products={products}
          onAddProduct={handleAdminAddProduct}
          onUpdateProduct={handleAdminUpdateProduct}
          onDeleteProduct={handleAdminDeleteProduct}
          onToggleHeroFeature={handleToggleHeroFeature}
          orders={orders}
          onUpdateOrderStatus={handleAdminUpdateOrderStatus}
          onAssignDeliveryAgent={handleAssignDeliveryAgent}
          onResolveDispute={handleResolveDispute}
          deliveryAgents={deliveryAgents}
          onAddDeliveryAgent={handleAddDeliveryAgent}
          chatMessages={chatMessages}
          onSendAdminReplyToClient={handleSendAdminReplyToClient}
          onClearClientMessages={handleClearClientMessages}
          onSetClientSupportDuration={handleSetClientSupportDuration}
          adminUser={userProfile}
          onSwitchToClientView={() => {
            setIsClientPreviewMode(true);
            setCurrentView('catalog');
          }}
          onOpenDeliveryPortal={() => setCurrentView('delivery')}
          onLogout={handleLogout}
        />
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // If current view is 'delivery', render the dedicated PORTAIL LIVREUR BÉNIN:
  if (currentView === 'delivery') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col antialiased">
        <DeliveryPortal
          orders={orders}
          deliveryAgents={deliveryAgents}
          currentAgent={currentDeliveryAgent}
          onSelectAgent={(agentId) => setCurrentDeliveryAgentId(agentId)}
          onVerifyDeliveryCode={handleVerifyDeliveryCode}
          onReportDeliveryIssue={handleReportDeliveryIssue}
          onBackToStore={() => setCurrentView('catalog')}
          notifications={deliveryNotifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onClearNotifications={handleClearNotifications}
        />
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // Regular Store Views (Catalog & Checkout)
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] flex flex-col antialiased selection:bg-[#292524] selection:text-[#FAF7F2]">
      
      {/* Offline Status Badge */}
      {!isOnline && (
        <div className="bg-[#1C1917] text-[#FAF7F2] py-1 px-3 text-center text-[10px] font-medium flex items-center justify-center gap-1.5 border-b border-[#3E3832]">
          <WifiOff className="w-3 h-3 text-[#E6C694]" />
          <span>Mode Hors-connexion actif — Les images et articles restent consultables.</span>
        </div>
      )}

      {/* Client Preview Mode Banner for Admin */}
      {isClientPreviewMode && (
        <div className="bg-[#1C1917] text-[#FAF7F2] py-2.5 px-4 border-b border-[#D4AF37]/50 shadow-md sticky top-0 z-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E6C694] animate-ping" />
            <span className="font-semibold text-[#E6C694]">Mode Aperçu Vue Client Actif</span>
            <span className="hidden sm:inline text-[#A89887]">
              — Vous visualisez la boutique telle que vos visiteurs la découvrent.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsClientPreviewMode(false);
              setCurrentView('admin');
            }}
            className="py-1 px-3.5 bg-[#E6C694] text-[#1C1917] hover:bg-[#F3DDBA] rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Revenir à la Console Admin (Plein Écran)</span>
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => {
          setAuthReason('manual');
          setIsAuthOpen(true);
        }}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenDelivery={() => setCurrentView('delivery')}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-10">
        {currentView === 'checkout' ? (
          <CheckoutPage
            primaryProduct={selectedCheckoutProduct}
            cartItems={cartItems}
            userProfile={userProfile}
            onBack={() => {
              setCurrentView('catalog');
              setSelectedCheckoutProduct(null);
            }}
            onOrderComplete={handleOrderComplete}
            onSaveMobileMoney={handleSaveMobileMoney}
          />
        ) : (
          <div className="space-y-1">
            {/* Sliding Hero Covers: Compact & customizable by Admin */}
            {searchQuery === '' && (
              <HeroCarousel
                products={products}
                onSelectProductForCheckout={handleDirectCheckout}
              />
            )}

            {/* Category Filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              productCounts={productCounts}
            />

            {/* Product Catalog Grid: 2 items per row on all smartphones (grid-cols-2) */}
            <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-1">
              {filteredProducts.length === 0 ? (
                <div className="bg-[#FCFAF7] border border-[#ECE3D5] rounded-2xl p-8 text-center max-w-sm mx-auto my-6 space-y-2">
                  <p className="font-serif-luxury text-sm font-medium text-[#1C1917]">
                    Aucun article trouvé
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 bg-[#1C1917] text-[#FAF7F2] rounded-full text-xs font-medium uppercase tracking-wider"
                  >
                    Voir tous les articles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectForCheckout={handleDirectCheckout}
                      onQuickAddToCart={handleAddToCart}
                      onOpenDetails={(p) => setDetailModalProduct(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Auth Modal (Standard luxury design without disclosing AD- credentials) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthReason(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        onOpenDeliveryPortal={() => setCurrentView('delivery')}
        reason={authReason}
      />

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        orders={orders.filter((o) => o.clientId === userProfile.id || o.buyerEmail === userProfile.email)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedCartCheckout}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailModalProduct}
        onClose={() => setDetailModalProduct(null)}
        onSelectForCheckout={handleDirectCheckout}
        onAddToCart={handleAddToCart}
      />

      {/* Live Chat Widget:
          Apparaît UNIQUEMENT lorsqu'une commande a été payée par le client.
          Compte à rebours de 30 minutes déclenché dès la livraison validée qui ferme et supprime la discussion. */}
      <LiveChatWidget
        messages={chatMessages.filter(
          (m) => (m.clientId || 'guest') === (userProfile.id || 'guest')
        )}
        onSendMessage={handleSendMessage}
        currentUser={userProfile}
        paidOrders={paidOrdersForCurrentClient}
        onClearClientMessages={handleClearClientMessages}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Footer */}
      <footer className="bg-[#FCFAF7] border-t border-[#ECE3D5] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8C7A68]">
          <div className="flex items-center gap-2">
            <span className="font-serif-luxury font-medium text-sm text-[#1C1917] tracking-wider">OrA</span>
            <span>·</span>
            <span>Montres & Parfums</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#A89887]">
            <span>Session : {userProfile.name} {userProfile.isAdmin && '(👑 Admin)'}</span>
            <span>·</span>
            <span>Paiement sécurisé FedaPay (MTN · Moov · Celtiis)</span>
            <span>·</span>
            <span>© 2026 OrA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
