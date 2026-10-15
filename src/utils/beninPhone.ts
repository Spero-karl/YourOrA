/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitaires pour le plan national de numérotation du Bénin :
 * - Tous les numéros de téléphone au Bénin comportent 10 chiffres.
 * - Tous les numéros sont obligatoirement précédés du préfixe « 01 ».
 * - Format national : 01 XX XX XX XX
 * - Format international : +229 01 XX XX XX XX
 */

export type BeninOperator = 'MTN' | 'Moov' | 'Celtiis';

export interface BeninOperatorInfo {
  id: BeninOperator;
  name: string;
  serviceName: string;
  primaryColor: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  description: string;
  popularPrefixes: string[];
}

export const BENIN_OPERATORS: Record<BeninOperator, BeninOperatorInfo> = {
  MTN: {
    id: 'MTN',
    name: 'MTN Bénin',
    serviceName: 'MTN MoMo',
    primaryColor: '#FFCC00',
    textColor: '#1C1917',
    borderColor: '#E6B800',
    badgeBg: 'bg-[#FFCC00] text-black border-[#E6B800]',
    description: 'Paiement instantané MTN Mobile Money Bénin',
    popularPrefixes: ['0197', '0196', '0161', '0162', '0151', '0152', '0153', '0154', '0142', '0146', '0166', '0167', '0169']
  },
  Moov: {
    id: 'Moov',
    name: 'Moov Africa Bénin',
    serviceName: 'Moov Money',
    primaryColor: '#0055A5',
    textColor: '#FFFFFF',
    borderColor: '#004488',
    badgeBg: 'bg-[#0055A5] text-white border-[#004488]',
    description: 'Paiement sécurisé Moov Money Bénin',
    popularPrefixes: ['0195', '0194', '0160', '0163', '0164', '0165', '0168', '0198', '0199']
  },
  Celtiis: {
    id: 'Celtiis',
    name: 'Celtiis Bénin',
    serviceName: 'Celtiis Cash',
    primaryColor: '#008080',
    textColor: '#FFFFFF',
    borderColor: '#006666',
    badgeBg: 'bg-[#008080] text-white border-[#006666]',
    description: 'Paiement direct Celtiis Cash Bénin (SBIN)',
    popularPrefixes: ['0140', '0141', '0143', '0144', '0145']
  }
};

/**
 * Nettoie une chaîne pour en extraire les chiffres nationaux béninois (max 10 chiffres).
 * Si l'utilisateur saisit sans le '01' initial (ex: 97001234), insère automatiquement '01'.
 */
export function sanitizeBeninDigits(raw: string): string {
  if (!raw) return '';

  // Supprime tous les caractères non numériques
  let digits = raw.replace(/\D/g, '');

  // Si commence par l'indicatif pays béninois 229, le retirer
  if (digits.startsWith('229')) {
    digits = digits.slice(3);
  }

  // Si l'utilisateur tape un ancien numéro à 8 chiffres qui ne commence pas par 01
  // (ex: commence par 97, 96, 61, 95, 40...), on s'assure qu'au-delà de 2 chiffres non-01
  // il est préfixé de '01' si l'utilisateur a oublié le 01.
  if (digits.length >= 2 && !digits.startsWith('01') && !digits.startsWith('0')) {
    digits = '01' + digits;
  } else if (digits === '0' || (digits.length === 1 && digits !== '0')) {
    // Si l'utilisateur a tapé un seul chiffre différent de 0, on l'aide en complétant '01'
    if (digits !== '0') {
      digits = '01' + digits;
    }
  }

  // Limite stricte à 10 chiffres (01 + 8 chiffres)
  return digits.slice(0, 10);
}

/**
 * Formate les chiffres au standard béninois : 01 XX XX XX XX
 */
export function formatBeninNational(raw: string): string {
  const digits = sanitizeBeninDigits(raw);
  if (!digits) return '';

  const parts: string[] = [];
  // Paquets de 2 chiffres : 01 XX XX XX XX
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  return parts.join(' ');
}

/**
 * Formate au standard international : +229 01 XX XX XX XX
 */
export function formatBeninInternational(raw: string): string {
  const national = formatBeninNational(raw);
  if (!national) return '';
  return `+229 ${national}`;
}

/**
 * Vérifie si le numéro est valide :
 * Exactement 10 chiffres et commence obligatoirement par 01.
 */
export function isValidBeninPhone(raw: string): boolean {
  const digits = sanitizeBeninDigits(raw);
  return digits.length === 10 && digits.startsWith('01');
}

/**
 * Détecte l'opérateur suggéré en fonction des préfixes béninois (après le 01)
 */
export function detectBeninOperator(raw: string): BeninOperator | null {
  const digits = sanitizeBeninDigits(raw);
  if (digits.length < 4) return null;

  const prefix = digits.slice(0, 4); // ex: 0197, 0195, 0140

  for (const op of Object.values(BENIN_OPERATORS)) {
    if (op.popularPrefixes.includes(prefix)) {
      return op.id;
    }
  }

  return null;
}
