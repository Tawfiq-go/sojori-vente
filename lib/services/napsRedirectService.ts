/**
 * NAPS redirect payment — creates guest reservation + returns NAPS payment URL.
 * Card data is entered on NAPS hosted page (PCI out of scope).
 */

import type { PriceBreakdown } from '@/components/DateRangePicker'
import { getSiteBaseUrl } from '@/lib/config/payment'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.sojori.com'

export interface GuestReservationPayload {
  listingId: string
  checkIn: string
  checkOut: string
  guests: { adults: number; children: number; infants: number }
  traveler: {
    firstName: string
    lastName: string
    email: string
    phone: string
    country?: string
    phoneCountryCode?: string
  }
  clerkId?: string
  clerkEnvironment?: 'development' | 'production'
  pricing: PriceBreakdown
  payment: {
    method: 'card' | 'later'
    returnBaseUrl?: string
    /** Annule l’ancienne résa UnPaid et en crée une nouvelle */
    replaceExisting?: boolean
  }
}

export class UnpaidReservationExistsError extends Error {
  readonly code = 'UNPAID_RESERVATION_EXISTS' as const
  readonly reservationNumber: string
  readonly paymentUrl: string | null

  constructor(reservationNumber: string, paymentUrl: string | null, message?: string) {
    super(message || 'Un paiement est déjà en attente pour ces dates')
    this.name = 'UnpaidReservationExistsError'
    this.reservationNumber = reservationNumber
    this.paymentUrl = paymentUrl
  }
}

export interface GuestReservationResult {
  reservationId: string
  reservationNumber: string
  paymentUrl: string | null
  status: string
  paymentStatus: string
}

export async function createGuestReservationWithNapsRedirect(
  payload: GuestReservationPayload,
): Promise<GuestReservationResult> {
  const body = {
    ...payload,
    payment: {
      ...payload.payment,
      returnBaseUrl: payload.payment.returnBaseUrl || getSiteBaseUrl(),
    },
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/guest/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    if (response.status === 409 && result.code === 'UNPAID_RESERVATION_EXISTS' && result.data) {
      throw new UnpaidReservationExistsError(
        result.data.reservationNumber,
        result.data.paymentUrl ?? null,
        result.error,
      )
    }
    const message =
      result.errors?.[0]?.message ||
      result.error ||
      result.message ||
      'Impossible de créer la réservation'
    throw new Error(message)
  }

  const paymentUrl = result.data.paymentUrl as string | null
  if (payload.payment.method === 'card' && !paymentUrl) {
    throw new Error(
      'Lien de paiement NAPS indisponible. Réessayez dans quelques instants ou choisissez un autre mode de paiement.',
    )
  }

  return {
    reservationId: result.data.reservationId,
    reservationNumber: result.data.reservationNumber,
    paymentUrl,
    status: result.data.status,
    paymentStatus: result.data.paymentStatus,
  }
}

export async function getGuestReservationByNumber(reservationNumber: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/guest/reservations/number/${encodeURIComponent(reservationNumber)}`,
  )
  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Réservation introuvable')
  }
  return result.data as {
    reservationNumber: string
    paymentStatus: string
    status: string
    paymentLink?: string | null
    lastNapsError?: {
      repauto?: string
      userMessage?: string
      message?: string
    } | null
    traveler: { email: string }
  }
}
