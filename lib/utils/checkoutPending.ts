/** Contexte paiement carte en cours — session uniquement (pas de bannière fantôme au checkout). */

const SESSION_KEY = 'sojoriCheckoutPending';
const LEGACY_LS_KEY = 'pendingReservationNumber';

export type CheckoutPendingContext = {
  reservationNumber: string;
  listingId: string;
  email?: string;
};

export function saveCheckoutPending(ctx: CheckoutPendingContext): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ctx));
    localStorage.setItem(LEGACY_LS_KEY, ctx.reservationNumber);
  } catch {
    /* ignore */
  }
}

export function readCheckoutPending(): CheckoutPendingContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutPendingContext;
    if (!parsed?.reservationNumber || !parsed?.listingId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutPending(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Afficher la reprise de paiement seulement pour ce listing + email cohérent. */
export function shouldShowCheckoutPending(
  ctx: CheckoutPendingContext | null,
  listingId: string,
  travelerEmail?: string,
): boolean {
  if (!ctx || ctx.listingId !== listingId) return false;
  const current = String(travelerEmail || '')
    .trim()
    .toLowerCase();
  const stored = String(ctx.email || '')
    .trim()
    .toLowerCase();
  if (!stored || !current) return true;
  return stored === current;
}
