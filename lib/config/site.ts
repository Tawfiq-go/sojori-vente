/**
 * URL canonique du site — pilotée par env pour la marque blanche
 * (chaque déploiement/domaine client aura son NEXT_PUBLIC_SITE_URL,
 * et le middleware multi-tenant la dérivera du Host à terme).
 * Toutes les metadata/canonical/JSON-LD doivent passer par ici,
 * jamais par un littéral « https://sojori.com ».
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sojori.com').replace(
  /\/+$/,
  '',
)

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
