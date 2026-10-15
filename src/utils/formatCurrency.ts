/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formate un montant en Francs CFA (FCFA)
 * Exemple : 275000 => "275 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}
