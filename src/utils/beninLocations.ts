/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BeninCity {
  name: string;
  popularQuarters: string[];
}

export const BENIN_CITIES: BeninCity[] = [
  {
    name: 'Cotonou',
    popularQuarters: [
      'Haie Vive',
      'Cadjèhoun',
      'Akpakpa',
      'Fidjrossè',
      'Kouhounou',
      'Menontin',
      'Agla',
      'Gbégamey',
      'Vodjè',
      'Maro-Militaire',
      'Zogbo',
      'Sainte-Rita',
      'Placodji'
    ]
  },
  {
    name: 'Abomey-Calavi',
    popularQuarters: [
      'Godomey',
      'Arconville',
      'Calavi Centre',
      'Bidossèssi',
      'Tankpè',
      'Zogbadjè',
      'Akassato',
      'Womey',
      'Togba'
    ]
  },
  {
    name: 'Porto-Novo',
    popularQuarters: [
      'Ouando',
      'Tokpota',
      'Djassin',
      'Avakpa',
      'Attakè',
      'Louho',
      'Sèmè-Kpodji'
    ]
  },
  {
    name: 'Ouidah',
    popularQuarters: [
      'Pahou',
      'Centre-ville',
      'Zomaï',
      'Kpassè'
    ]
  },
  {
    name: 'Parakou',
    popularQuarters: [
      'Albarika',
      'Banikanni',
      'Titirou',
      'Camp Adagbè'
    ]
  },
  {
    name: 'Bohicon',
    popularQuarters: ['Centre-ville', 'Sogloghè', 'Agongointo']
  }
];

export const BENIN_DELIVERY_ZONES = [
  'Cotonou Littoral (Haie Vive, Cadjèhoun, Fidjrossè)',
  'Abomey-Calavi & Godomey (Arconville, Bidossèssi)',
  'Akpakpa & Porto-Novo (PK10, Sèmè-Kpodji)',
  'Ouidah & Environs (Pahou, Route des Pêches)',
  'Parakou & Région Nord'
];
