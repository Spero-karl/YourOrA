export interface Product {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isRecent?: boolean;
  isPromo?: boolean;
  isFeaturedInHero?: boolean;
  promoBadgeText?: string;
  image: string;
  description: string;
  fullDescription?: string;
  features?: string[];
  specs?: Record<string, string>;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface SavedMobileMoney {
  operator: 'MTN' | 'Moov' | 'Celtiis';
  phoneNumber: string;
  accountName: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  avatarUrl?: string;
  savedMobileMoney?: SavedMobileMoney | null;
  role?: 'guest' | 'customer' | 'admin' | 'delivery';
  isAdmin?: boolean;
  deliveryAgentId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface OrderEvent {
  id: string;
  timestamp: number;
  action: string;
  actor: string; // e.g. "Client", "Livreur (Marc Dossou)", "Passerelle FedaPay", "Admin"
  details?: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  zone: string; // e.g. "Cotonou Littoral & Haie Vive", "Abomey-Calavi & Godomey", "Akpakpa & Porto-Novo"
  status: 'active' | 'in_transit' | 'offline';
  completedDeliveries: number;
  rating: number;
  joinedDate: string;
  vehicle?: string;
}

export type OrderStatus =
  | 'Confirmée' // Fonds sécurisés sous séquestre
  | 'En préparation' // Commande en cours de conditionnement
  | 'Expédiée' // Remise au livreur, en route
  | 'Livrée' // Code validé par le livreur, fonds débloqués
  | 'Litige' // Colis refusé, échec ou anomalie, fonds bloqués
  | 'Remboursée'; // Remboursé au client via FedaPay

export type EscrowStatus =
  | 'held' // Fonds sécurisés sous séquestre
  | 'released' // Fonds débloqués au vendeur
  | 'disputed' // Fonds bloqués sous séquestre en litige
  | 'refunded'; // Fonds restitués au client

export interface Order {
  id: string;
  clientId: string;
  date: string;
  createdAt: number; // millisecond timestamp
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  escrowStatus: EscrowStatus;
  deliveryCode: string; // Code OTP unique généré après paiement, e.g. "LIV-8492"
  assignedDeliveryAgentId?: string;
  assignedDeliveryAgentName?: string;
  deliveredAt?: number;
  deliveryNote?: string;
  disputeReason?: string;
  timeline: OrderEvent[];
  shippingAddress: string;
  paymentMethod: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface ChatMessage {
  id: string;
  clientId?: string;
  sender: 'user' | 'admin' | 'concierge';
  senderName: string;
  text: string;
  timestamp: string;
  isAdminReply?: boolean;
}

export interface ClientAccount {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  orders: Order[];
  totalSpent: number;
  supportExpiresAt?: number;
  supportDurationHours?: number;
}

export interface DeliveryNotification {
  id: string;
  agentId: string;
  orderId: string;
  orderNumber?: string;
  customerName: string;
  shippingAddress: string;
  amount: number;
  timestamp: number;
  read: boolean;
  message: string;
}
