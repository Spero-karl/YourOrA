/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowLeft,
  Check,
  AlertCircle,
  Package,
  KeyRound,
  X,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Sparkles
} from 'lucide-react';
import { Order, DeliveryAgent, DeliveryNotification } from '../types';
import { formatFCFA } from '../utils/formatCurrency';
import { getAssetUrl } from '../utils/imageUtils';
import { playDeliveryChime, requestNotificationPermission } from '../utils/deliveryNotifications';

interface DeliveryPortalProps {
  orders: Order[];
  deliveryAgents: DeliveryAgent[];
  currentAgent: DeliveryAgent;
  onSelectAgent: (agentId: string) => void;
  onVerifyDeliveryCode: (orderId: string, enteredCode: string) => { success: boolean; message: string };
  onReportDeliveryIssue: (orderId: string, reason: string) => void;
  onBackToStore: () => void;
  notifications?: DeliveryNotification[];
  onMarkNotificationRead?: (notifId: string) => void;
  onClearNotifications?: () => void;
}

export const DeliveryPortal: React.FC<DeliveryPortalProps> = ({
  orders,
  deliveryAgents,
  currentAgent,
  onSelectAgent,
  onVerifyDeliveryCode,
  onReportDeliveryIssue,
  onBackToStore,
  notifications = [],
  onMarkNotificationRead,
  onClearNotifications
}) => {
  const [codeInputMap, setCodeInputMap] = useState<Record<string, string>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});
  const [problemModalOrder, setProblemModalOrder] = useState<Order | null>(null);
  const [problemReason, setProblemReason] = useState('Client absent / injoignable');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter orders assigned to this agent or not yet delivered
  const assignedOrders = orders.filter(
    (o) =>
      o.assignedDeliveryAgentId === currentAgent.id ||
      (!o.assignedDeliveryAgentId && o.status !== 'Livrée' && o.status !== 'Remboursée')
  );

  const pendingOrders = assignedOrders.filter(
    (o) => o.status !== 'Livrée' && o.status !== 'Remboursée'
  );

  const completedOrders = orders.filter(
    (o) => o.status === 'Livrée' && (o.assignedDeliveryAgentId === currentAgent.id || !o.assignedDeliveryAgentId)
  );

  // Filter notifications for this courier
  const courierNotifs = notifications.filter(
    (n) => n.agentId === currentAgent.id || n.agentId === currentAgent.name
  );
  const unreadNotifs = courierNotifs.filter((n) => !n.read);

  // Play chime on fresh unread notification
  useEffect(() => {
    if (unreadNotifs.length > 0 && soundEnabled) {
      playDeliveryChime();
    }
  }, [unreadNotifs.length, soundEnabled]);

  const handleValidate = (order: Order) => {
    const code = (codeInputMap[order.id] || '').trim();
    if (!code) {
      setFeedbackMap((prev) => ({
        ...prev,
        [order.id]: { type: 'error', text: 'Veuillez saisir le code donné par le client.' }
      }));
      return;
    }

    const res = onVerifyDeliveryCode(order.id, code);
    setFeedbackMap((prev) => ({
      ...prev,
      [order.id]: { type: res.success ? 'success' : 'error', text: res.message }
    }));

    if (res.success) {
      setCodeInputMap((prev) => ({ ...prev, [order.id]: '' }));
    }
  };

  const handleConfirmProblem = () => {
    if (!problemModalOrder) return;
    onReportDeliveryIssue(problemModalOrder.id, problemReason);
    setProblemModalOrder(null);
  };

  const handleEnableSystemNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      playDeliveryChime();
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b-2 border-slate-800 px-4 py-3.5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStore}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Retour à la boutique"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
                  Espace Livreur
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                    En service
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  {currentAgent.name} · {currentAgent.zone}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions: Notifications & Agent Switch */}
          <div className="flex items-center gap-2">
            
            {/* Notification Bell Button with Unread Badge */}
            <button
              type="button"
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
              title="Notifications des commandes assignées"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-extrabold rounded-full animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Single Unique Courier Account Badge (No switchable accounts) */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-xl py-1.5 px-3 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{currentAgent.name}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-5 flex-1 space-y-4">
        
        {/* ======================================================== */}
        {/* BANNIÈRE DE NOTIFICATION LOCALE : COMMANDE ASSIGNÉE      */}
        {/* ======================================================== */}
        {unreadNotifs.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-amber-950 font-extrabold text-sm">
                  Nouvelle course assignée ! ({unreadNotifs.length} non lue{unreadNotifs.length > 1 ? 's' : ''})
                </strong>
                <p className="text-amber-900 mt-0.5 font-medium">
                  {unreadNotifs[0].message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {onMarkNotificationRead && (
                <button
                  type="button"
                  onClick={() => onMarkNotificationRead(unreadNotifs[0].id)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors shadow-xs"
                >
                  Marquer comme lu
                </button>
              )}
            </div>
          </div>
        )}

        {/* Onglets Simples */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-1.5 flex items-center gap-1.5 text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Colis à livrer</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'pending' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Historique livré</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'completed' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* TAB 1: PENDING DELIVERIES */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-10 text-center space-y-2 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Aucune livraison en attente</h3>
                <p className="text-xs text-slate-500">
                  Vous êtes à jour. Dès qu'une nouvelle commande vous est assignée par l'administrateur, une notification retentira immédiatement.
                </p>
              </div>
            ) : (
              pendingOrders.map((order, index) => {
                const feedback = feedbackMap[order.id];
                const enteredCode = codeInputMap[order.id] || '';

                return (
                  <div
                    key={order.id}
                    className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-400 transition-all"
                  >
                    {/* Client & Phone Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Colis #{index + 1} · Client Destinataire
                        </span>
                        <h2 className="text-base font-bold text-slate-900">{order.buyerName || 'Client'}</h2>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>

                      {order.buyerPhone && (
                        <a
                          href={`tel:${order.buyerPhone}`}
                          className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Appeler le client ({order.buyerPhone})</span>
                        </a>
                      )}
                    </div>

                    {/* Address & Landmark */}
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 text-xs space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">{order.shippingAddress}</p>
                          {order.deliveryNote && (
                            <p className="text-slate-600 text-[11px] mt-0.5 font-medium">
                              Indication : {order.deliveryNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items & Total */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-100 p-1.5 pr-3 rounded-lg border border-slate-300"
                          >
                            <img
                              src={getAssetUrl(it.productImage)}
                              alt={it.productName}
                              className="w-7 h-7 object-cover rounded-md border border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-800">
                              {it.quantity}x {it.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-right text-xs text-slate-600 font-bold">
                        Montant total : <span className="font-mono text-sm text-slate-900">{formatFCFA(order.total)}</span>
                      </div>
                    </div>

                    {/* Feedback message */}
                    {feedback && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          feedback.type === 'success'
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : 'bg-rose-100 text-rose-950 border border-rose-300'
                        }`}
                      >
                        {feedback.type === 'success' ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-700" />
                        )}
                        <span>{feedback.text}</span>
                      </div>
                    )}

                    {/* Delivery Code Verification Form */}
                    <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-700" />
                          Code de remise client
                        </label>
                        <span className="text-[10px] text-amber-800 font-semibold">
                          Le client doit vous communiquer son code à la réception
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={enteredCode}
                          onChange={(e) =>
                            setCodeInputMap((prev) => ({
                              ...prev,
                              [order.id]: e.target.value.toUpperCase()
                            }))
                          }
                          placeholder="Entrez le code secret..."
                          className="flex-1 px-3.5 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleValidate(order)}
                          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Valider la remise</span>
                        </button>
                      </div>
                    </div>

                    {/* Report Delay / Problem Action */}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setProblemModalOrder(order)}
                        className="text-xs text-slate-500 hover:text-rose-700 font-bold underline hover:no-underline"
                      >
                        Signaler un empêchement ou un retard
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED DELIVERIES */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-10 text-center space-y-2 shadow-sm">
                <Package className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Aucun historique de livraison</h3>
                <p className="text-xs text-slate-500">Les colis validés par code secret apparaîtront ici.</p>
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{order.buyerName || 'Client'}</h3>
                    <p className="text-slate-600 font-medium">{order.shippingAddress}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{order.items.length} article(s) · {formatFCFA(order.total)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-bold text-xs shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Livrée avec succès</span>
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* Notifications Drawer Modal */}
      {isNotifDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Centre de Notifications
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sound alert status notice (no test button) */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Les alertes sonores et visuelles sont automatiquement activées lors de chaque nouvelle attribution.</span>
            </div>

            {/* Notifications list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {courierNotifs.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Aucune notification pour le moment.
                </div>
              ) : (
                courierNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      n.read
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Commande #{n.orderId}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.message}</p>
                    {!n.read && onMarkNotificationRead && (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationRead(n.id)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline"
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {courierNotifs.length > 0 && onClearNotifications && (
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="text-xs text-slate-500 hover:text-rose-700 font-bold"
                >
                  Effacer l'historique
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Problem Modal */}
      {problemModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl border-2 border-slate-300">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Signaler un empêchement</h3>
              <button
                type="button"
                onClick={() => setProblemModalOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Précisez la raison pour laquelle le colis ne peut pas être remis maintenant :
            </p>

            <select
              value={problemReason}
              onChange={(e) => setProblemReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-900"
            >
              <option value="Client absent / injoignable">Client absent ou injoignable</option>
              <option value="Client demande de repasser plus tard">Client demande de repasser plus tard</option>
              <option value="Adresse introuvable">Adresse introuvable</option>
              <option value="Colis refusé par le client">Colis refusé par le client</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProblemModalOrder(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmProblem}
                className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-black"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
