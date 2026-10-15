import { DeliveryAgent } from '../types';

export const INITIAL_DELIVERY_AGENTS: DeliveryAgent[] = [
  {
    id: 'livreur-1',
    name: 'Marc Dossou',
    phone: '+229 01 97 45 20 11',
    zone: 'Cotonou Littoral (Haie Vive, Cadjèhoun, Fidjrossè)',
    status: 'active',
    completedDeliveries: 42,
    rating: 4.9,
    joinedDate: '15 Janvier 2026'
  },
  {
    id: 'livreur-2',
    name: 'Sègla Houndété',
    phone: '+229 01 95 12 34 56',
    zone: 'Akpakpa & Agglomération de Porto-Novo',
    status: 'active',
    completedDeliveries: 28,
    rating: 4.8,
    joinedDate: '02 Février 2026'
  },
  {
    id: 'livreur-3',
    name: 'Brice Kpadonou',
    phone: '+229 01 40 88 99 00',
    zone: 'Abomey-Calavi, Arconville & Godomey',
    status: 'in_transit',
    completedDeliveries: 35,
    rating: 4.9,
    joinedDate: '20 Janvier 2026'
  },
  {
    id: 'livreur-4',
    name: 'Félicien Agossou',
    phone: '+229 01 96 77 44 11',
    zone: 'Parakou & Hub Septentrion',
    status: 'offline',
    completedDeliveries: 19,
    rating: 4.7,
    joinedDate: '10 Mars 2026'
  }
];
