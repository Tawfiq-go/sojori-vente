/**
 * Payment mode for sojori-vente checkout.
 *
 * - redirect (default): NAPS hosted page — PCI SAQ A, no card fields on our site
 * - api: direct /authorization via PaymentIntent (kept for future use, disabled in UI)
 */
export type PaymentMode = 'redirect' | 'api'

export const PAYMENT_MODE: PaymentMode =
  process.env.NEXT_PUBLIC_PAYMENT_MODE === 'api' ? 'api' : 'redirect'

export function getSiteBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/^/, 'https://') ||
    'http://localhost:6001'
  )
}
