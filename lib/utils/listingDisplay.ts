/** Affiche une note listing uniquement si l'API en fournit une (> 0). */
export function listingRatingLabel(rating?: number | null): string | null {
  const n = Number(rating);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(1);
}

/** Tronque une description PM vitrine (évite les pavés sur la homepage). */
export function truncatePmText(text: string | null | undefined, max = 220): string | null {
  const t = String(text || '').trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}
