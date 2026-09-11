/**
 * Affichage prix MAD : entier arrondi, sans virgule décimale (850,72 → 851).
 */
export function formatMadAmount(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatMadLabel(amount: number, suffix = 'MAD'): string {
  return `${formatMadAmount(amount)} ${suffix}`;
}
