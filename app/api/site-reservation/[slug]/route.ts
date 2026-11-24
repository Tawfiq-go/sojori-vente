import { NextRequest, NextResponse } from 'next/server'
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { ipDuVisiteur, limiteur } from '@/lib/site/commande'
import { decomposerId, lireSejour, lireType } from '@/lib/site/moteur'
import { creer, traiter } from '@/lib/site/reservation'

/**
 * Réserver une chambre depuis le site d'un PM, paiement par carte (voir lib/site/reservation.ts, `traiter` porte toute la décision). ÉTEINT (404)
 * tant que le slug du site n'est pas dans `SITE_RESERVATION_LIGNE_SLUGS`. Le prix est relu ICI chez srv-listing ; srv-reservations le re-vérifie et
 * applique la garde marque blanche par propriétaire.
 */
type Contexte = { params: Promise<{ slug: string }> }

const parMinute = limiteur(6)

export async function POST(req: NextRequest, ctx: Contexte) {
  const { slug } = await ctx.params
  const r = await traiter(
    {
      slug,
      brut: await req.text(),
      ip: ipDuVisiteur(req.headers.get('x-forwarded-for'), req.headers.get('x-real-ip')),
      hote: (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0],
    },
    {
      env: process.env,
      limite: parMinute,
      sejour: lireSejour,
      ids: decomposerId,
      type: (s, id, sejour, ip) => lireType(s, id, sejour, ip),
      creer: (corps) => creer(corps, getRemoteApiBaseUrl()),
    },
  )
  return NextResponse.json(r.corps, { status: r.statut, headers: { 'cache-control': 'no-store' } })
}
