import type { BookingProfileMetadata } from './bookingProfile'

/** Met à jour le profil booking dans Clerk → webhook user.updated → srv-user. */
export async function syncBookingProfileToClerk(profile: BookingProfileMetadata): Promise<void> {
  const res = await fetch('/api/clerk/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Impossible de synchroniser le profil')
  }
}
