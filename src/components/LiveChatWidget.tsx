import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Clock,
  ShieldCheck,
  Headphones,
  CheckCheck,
  AlertTriangle,
  Timer,
  ArrowLeft
} from 'lucide-react';
import { ChatMessage, UserProfile, Order } from '../types';

interface LiveChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: UserProfile;
  paidOrders: Order[];
  onClearClientMessages: (clientId: string) => void;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  messages,
  onSendMessage,
  currentUser,
  paidOrders,
  onClearClientMessages
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // REGLE 1 : La messagerie apparait UNIQUEMENT lorsqu'une commande a été payée par le client
  const hasPaidOrder = paidOrders && paidOrders.length > 0;
  const latestOrder = hasPaidOrder ? paidOrders[0] : null;

  // REGLE 2 : La discussion est fermée 30 minutes après chaque livraison validée
  const isDelivered = latestOrder?.status === 'Livrée';
  const deliveredTime = latestOrder?.deliveredAt || (isDelivered ? latestOrder?.createdAt : undefined);

  useEffect(() => {
    if (!isDelivered || !deliveredTime) {
      setSecondsRemaining(null);
      return;
    }

    const THIRTY_MINUTES_SEC = 30 * 60; // 1800 secondes

    const updateCountdown = () => {
      const elapsedSeconds = Math.floor((Date.now() - deliveredTime) / 1000);
      const remaining = THIRTY_MINUTES_SEC - elapsedSeconds;

      if (remaining <= 0) {
        setSecondsRemaining(0);
        // Supprimer toute la discussion chez le client
        if (currentUser.id) {
          onClearClientMessages(currentUser.id);
        }
        setIsOpen(false);
      } else {
        setSecondsRemaining(remaining);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isDelivered, deliveredTime, currentUser.id, onClearClientMessages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Si le client n'a aucune commande payée -> la messagerie n'apparaît pas du tout
  if (!hasPaidOrder) {
    return null;
  }

  // Si la commande est livrée et que les 30 minutes sont écoulées -> supprimée et masquée
  if (isDelivered && secondsRemaining !== null && secondsRemaining <= 0) {
    return null;
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickQuestion = (q: string) => {
    onSendMessage(q);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      
      {/* BOUTON FLOTTANT STYLE WHATSAPP / MESSENGER */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="relative flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-full shadow-2xl border border-emerald-500/50 transition-all active:scale-95 group animate-in fade-in cursor-pointer"
          aria-label="Ouvrir l'assistance client"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-900 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold tracking-wide block">
              Assistance Client YourOrA
            </span>
            <span className="text-[10px] text-emerald-100 block">
              {isDelivered && secondsRemaining !== null
                ? `Ferme dans ${formatTimer(secondsRemaining)}`
                : 'Commande payée • Support actif'}
            </span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* FENÊTRE DE DISCUSSION STYLE WHATSAPP / MESSENGER */}
      {isOpen && (
        <div className="w-[330px] sm:w-[380px] bg-[#ECE5DD] border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header Vert WhatsApp */}
          <div className="p-3.5 bg-emerald-800 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1 -ml-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700/80 transition-colors cursor-pointer shrink-0"
                title="Sortir de la discussion (Retour)"
                aria-label="Sortir de la discussion"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-emerald-950 text-amber-300 flex items-center justify-center font-bold text-sm border border-emerald-600 shadow-xs">
                  OrA
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-emerald-900" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                  <span>Support Client YourOrA</span>
                </h4>
                <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <span>En ligne • Échange direct</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer shrink-0"
              title="Fermer la fenêtre"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bandeau d'identification du compte client */}
          <div className="px-3 py-1.5 bg-emerald-900/10 border-b border-emerald-900/10 text-[10px] text-slate-700 flex items-center justify-between backdrop-blur-xs">
            <span className="flex items-center gap-1 font-medium truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Compte : <strong>{currentUser.name || 'Client'}</strong></span>
            </span>
            <span className="text-[9px] font-mono bg-white/80 text-emerald-800 px-1.5 py-0.2 rounded font-bold shrink-0">
              Commande #{latestOrder?.id}
            </span>
          </div>

          {/* Corps de conversation avec bulles de chat WhatsApp */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-[#EFEAE2]/80">
            {messages.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-slate-600 bg-white/70 p-4 rounded-2xl border border-slate-200/80 my-4 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Headphones className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">
                  Votre messagerie d'assistance est ouverte
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bonjour {currentUser.name} ! Votre commande a bien été payée. Écrivez-nous votre message ci-dessous pour toute question sur la préparation ou votre coursier.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'user' && !msg.isAdminReply;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs shadow-2xs relative ${
                        isMe
                          ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs'
                          : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5 text-[9px] opacity-75 font-semibold">
                        <span>{isMe ? 'Vous' : msg.senderName || 'Support YourOrA'}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line text-xs">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Raccourcis de questions rapides */}
          <div className="px-2.5 py-1.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickQuestion('Ma commande est-elle en cours de livraison ?')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 transition-colors cursor-pointer"
            >
              Statut de la course ?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('Quel est le numéro de mon livreur ?')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 transition-colors cursor-pointer"
            >
              Contact du coursier ?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('J’ai bien reçu mon colis, merci beaucoup !')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 transition-colors cursor-pointer"
            >
              Colis reçu
            </button>
          </div>

          {/* REGLE 2 : PETIT COMPTE A REBOURS EN BAS APRES LIVRAISON VALIDEE */}
          {isDelivered && secondsRemaining !== null && secondsRemaining > 0 && (
            <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-amber-900 text-[11px] animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium">
                <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Livraison validée. Fermeture et suppression :</span>
              </div>
              <span className="font-mono font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md text-xs">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          )}

          {/* Barre de saisie style Messenger */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Écrivez votre message à l'assistance..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-full transition-all cursor-pointer shadow-xs"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
