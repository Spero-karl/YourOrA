import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Clock, ShieldCheck, Headphones } from 'lucide-react';
import { ChatMessage, UserProfile, Order } from '../types';

interface LiveChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: UserProfile;
  isInCheckout: boolean;
  activeOrder?: Order | null;
  supportDurationHours?: number;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  messages,
  onSendMessage,
  currentUser,
  isInCheckout,
  activeOrder,
  supportDurationHours = 24
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Requirement: "l'assistance ne sera disponible qu'apres qu'on est sur que le client entamme le processus de payement"
  // And "Apres commande, le support d'assistance dure 24h"
  const isPostOrderSupportActive = Boolean(
    activeOrder &&
    activeOrder.createdAt &&
    Date.now() < activeOrder.createdAt + supportDurationHours * 3600 * 1000
  );

  const isAssistanceAvailable = isInCheckout || isPostOrderSupportActive;

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // If assistance is not active, do not render widget
  if (!isAssistanceAvailable) {
    return null;
  }

  // Calculate remaining support hours if after order
  let remainingHours = supportDurationHours;
  if (activeOrder?.createdAt) {
    const elapsedMs = Date.now() - activeOrder.createdAt;
    const remainingMs = supportDurationHours * 3600 * 1000 - elapsedMs;
    remainingHours = Math.max(1, Math.round(remainingMs / (3600 * 1000)));
  }

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
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          className="relative flex items-center gap-2 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] py-2.5 px-4 rounded-full shadow-xl border border-[#E6C694]/50 transition-all active:scale-95 group animate-in fade-in"
          aria-label="Ouvrir l'assistance paiement"
        >
          <div className="relative">
            <Headphones className="w-4 h-4 text-[#E6C694]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold tracking-wide block">
              {isInCheckout ? 'Assistance Paiement' : 'Assistance Commande'}
            </span>
            <span className="text-[9px] text-[#D4C3B2] block">
              {isInCheckout ? 'Un conseiller vous répond' : `Support actif (${remainingHours}h)`}
            </span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-[#E6C694] text-[#1C1917] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-[#FCFAF7] border border-[#ECE3D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="p-3.5 bg-[#1C1917] text-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#E6C694] text-[#1C1917] flex items-center justify-center font-bold text-xs">
                OrA
              </div>
              <div>
                <h4 className="font-serif-luxury text-xs font-semibold text-[#FAF7F2] leading-tight">
                  {isInCheckout ? 'Assistance Règlement' : 'Assistance Personnalisée'}
                </h4>
                <p className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {isPostOrderSupportActive
                    ? `Support post-commande garanti (${remainingHours}h restantes)`
                    : 'Conseiller disponible pour votre paiement'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="p-1 rounded-full text-[#A89887] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Banner */}
          <div className="px-3 py-1.5 bg-[#F4ECE1] border-b border-[#E3D7C7] text-[10px] text-[#57534E] flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8C7A68]" />
              Client : {currentUser.name || 'Invité'} ({currentUser.id || 'id'})
            </span>
            <span className="flex items-center gap-1 text-[#8C7A68]">
              <Clock className="w-3 h-3" />
              {isInCheckout ? 'En cours de paiement' : `Délai 24h`}
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-[#FAF7F2]/50">
            {messages.length === 0 ? (
              <div className="text-center py-6 space-y-2 text-[#78716C]">
                <Headphones className="w-6 h-6 text-[#A89887] mx-auto stroke-1" />
                <p className="text-xs">
                  Bonjour {currentUser.name} ! Avez-vous besoin d'aide pour finaliser votre règlement Mobile Money Bénin (MTN MoMo, Moov Money ou Celtiis Cash) ?
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
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        isMe
                          ? 'bg-[#1C1917] text-[#FAF7F2]'
                          : msg.isAdminReply
                          ? 'bg-[#EFE8DD] border border-[#D5C6B3] text-[#1C1917]'
                          : 'bg-white border border-[#ECE3D5] text-[#1C1917]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5 text-[9px] opacity-75">
                        <span className="font-semibold">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-2.5 py-1.5 bg-[#F7F2EB] border-t border-[#ECE3D5] flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickQuestion('Comment valider mon paiement MoMo ?')}
              className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white border border-[#D9CDBF] text-[10px] text-[#44403C] hover:bg-[#F3ECE1]"
            >
              Validation MoMo ?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('Mon paiement est-il bien passé ?')}
              className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white border border-[#D9CDBF] text-[10px] text-[#44403C] hover:bg-[#F3ECE1]"
            >
              Confirmation paiement ?
            </button>
            <button
              type="button"
              onClick={() => handleQuickQuestion('Quel est le délai de livraison de ma commande ?')}
              className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white border border-[#D9CDBF] text-[10px] text-[#44403C] hover:bg-[#F3ECE1]"
            >
              Délai de livraison ?
            </button>
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-[#ECE3D5] flex gap-1.5">
            <input
              type="text"
              placeholder="Posez votre question à l'assistance..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 bg-[#FAF7F2] border border-[#D9CDBF] rounded-full focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-[#1C1917] hover:bg-[#2A2623] text-[#FAF7F2] rounded-full transition-all"
              aria-label="Envoyer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
