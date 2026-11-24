import { NextRequest, NextResponse } from 'next/server'
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { ipDuVisiteur, limiteur } from '@/lib/site/commande'
import { decomposerId, lireSejour, lireType } from '@/lib/site/moteur'
import { CORPS_MAX, corpsReservation, creer, lireDemande, reservationEnLigne } from '@/lib/site/reservation'

/**
 * Réserver une chambre depuis le site d'un PM, paiement par carte (voir lib/site/reservation.ts). ÉTEINT (404) tant que le slug du site n'est pas
 * dans `SITE_RESERVATION_LIGNE_SLUGS`. Le prix est relu ICI chez srv-listing ; srv-reservations le re-vérifie et applique la garde marque blanche.
 */
type Contexte = { params: Promise<{ slug: string }> }

const parMinute = limiteur(6)
const reponse = (corps: Record<string, unknown>, statut: number) => NextResponse.json(corps, { status: statut, headers: { 'cache-control': 'no-store' } })

export async function POST(req: NextRequest, ctx: Contexte) {
  const { slug } = await ctx.params
  if (!/^[a-z0-9-]{3,40}$/.test(slug) || !reservationEnLigne(slug)) return reponse({ success: false }, 404)
  const ip = ipDuVisiteur(req.headers.get('x-forwarded-for'), req.headers.get('x-real-ip'))
  if (parMinute(ip)) return reponse({ success: false, code: 'TROP_DE_DEMANDES' }, 429)

  const brut = await req.text()
  if (brut.length > CORPS_MAX) return reponse({ success: false, code: 'VALIDATION' }, 413)
  const demande = lireDemande(brut)
  const sejour = demande ? lireSejour({ checkIn: demande.checkIn, checkOut: demande.checkOut, adults: String(demande.adults) }) : null
  const ids = demande ? decomposerId(demande.typeId) : null
  if (!demande || !sejour || !ids) return reponse({ success: false, code: 'VALIDATION' }, 400)

  // Le type doit être un type de CE PM (lecture bornée par `?pm=<slug>`), libre pour ce séjour, avec son devis relu à l'instant.
  const type = await lireType(slug, demande.typeId, sejour, ip)
  if (!type || type.etat !== 'libre' || !type.devis?.detail) return reponse({ success: false, code: 'INDISPONIBLE' }, 409)

  // Retour du navigateur sur CE site (https, hôte du site) : srv-reservations n'accepte que des hôtes de confiance.
  const hote = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim().toLowerCase()
  if (!/^[a-z0-9.-]{3,100}$/.test(hote)) return reponse({ success: false, code: 'VALIDATION' }, 400)

  const r = await creer(corpsReservation(demande, ids, type.devis.detail, slug, `https://${hote}`), getRemoteApiBaseUrl())
  if (!r.ok) return reponse({ success: false, code: r.code }, r.statut)
  return reponse({ success: true, paymentUrl: r.paymentUrl, reservationNumber: r.reservationNumber }, 200)
}
