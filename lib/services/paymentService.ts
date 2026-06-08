/**
 * Payment Service - NAPS API directe (/authorization)
 *
 * ⚠️ Désactivé en prod UI — le checkout utilise NAPS redirect (napsRedirectService.ts).
 * Conservé pour tests / bascule via NEXT_PUBLIC_PAYMENT_MODE=api.
 */

import { encryptCardData, type CardData } from '@/lib/utils/cardEncryption'

// Defaults to the main API host (dev.sojori.com) which routes /api/v1/payments
// to srv-reservations via the ingress. Override with NEXT_PUBLIC_API_PAYMENTS_URL
// (e.g. http://localhost:14004/api/v1/payments) for local port-forward testing.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_PAYMENTS_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:14004'}/api/v1/payments`

export interface PaymentIntent {
  id: string
  status: string
  amount: number
  currency: string
  context: {
    type: string
    referenceId: string
  }
  createdAt: string
}

export interface PaymentContext {
  type: 'reservation' | 'deposit'
  referenceId: string
}

export interface GuestSnapshot {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface CreatePaymentIntentRequest {
  amount: number // En centimes (ex: 15000 = 150.00 MAD)
  currency?: string // ISO numeric (504 pour MAD)
  context: PaymentContext
  guest: GuestSnapshot
  metadata?: Record<string, string>
}

export interface ConfirmPaymentResult {
  success: boolean
  data?: {
    id: string
    status: string
    providerData?: any
    reservationId?: string
    reservationNumber?: string
  }
  requiresAction?: boolean
  actionUrl?: string
  error?: string
  errorCode?: string
}

/**
 * Get RSA public key for card encryption
 */
export async function getPublicKey(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/public-key`)

  if (!response.ok) {
    throw new Error('Failed to fetch public key')
  }

  const data = await response.json()

  if (!data.success || !data.data.publicKey) {
    throw new Error('Invalid public key response')
  }

  return data.data.publicKey
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntent> {
  const response = await fetch(`${API_BASE_URL}/intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create payment intent')
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to create payment intent')
  }

  return data.data
}

/**
 * Confirm payment with encrypted card data
 */
export async function confirmPayment(
  intentId: string,
  cardData: CardData
): Promise<ConfirmPaymentResult> {
  try {
    // 1. Get public key
    const publicKey = await getPublicKey()

    // 2. Encrypt card data
    const encryptedCardData = await encryptCardData(cardData, publicKey)

    // 3. Confirm payment
    const response = await fetch(`${API_BASE_URL}/intents/${intentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encryptedCardData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Payment confirmation failed',
        errorCode: data.errorCode,
      }
    }

    // Check if 3DS challenge required
    if (data.requiresAction && data.actionUrl) {
      return {
        success: false,
        requiresAction: true,
        actionUrl: data.actionUrl,
        data: data.data,
      }
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Payment failed',
        errorCode: data.errorCode,
      }
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error('[PaymentService] Confirm payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    }
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const response = await fetch(`${API_BASE_URL}/intents/${intentId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch payment intent')
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch payment intent')
  }

  return data.data
}

/**
 * Complete payment flow (create + confirm)
 */
export async function processPayment(
  request: CreatePaymentIntentRequest,
  cardData: CardData
): Promise<ConfirmPaymentResult> {
  try {
    // 1. Create payment intent
    const intent = await createPaymentIntent(request)

    // 2. Confirm with card data
    const result = await confirmPayment(intent.id, cardData)

    return result
  } catch (error) {
    console.error('[PaymentService] Process payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    }
  }
}
