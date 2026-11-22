import { relayer } from '@/lib/site/commande'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Le panneau de commande d'une landing de service → srv-site, côté serveur (voir lib/site/commandeRelais.ts). Éteint (404) tant que
 * `SITE_COMMANDE_LANDING` ne vaut pas « 1 ». Trois gestes seulement : créneaux (GET), commande (POST), lien de paiement (POST).
 */
type Contexte = { params: Promise<{ slug: string; pageId: string; suite: string[] }> }

async function passer(req: NextRequest, ctx: Contexte) {
  const { slug, pageId, suite } = await ctx.params
  const r = await relayer({
    methode: req.method,
    slug,
    pageId,
    suite,
    recherche: req.nextUrl.searchParams,
    corps: req.method === 'POST' ? await req.text() : null,
    forwardedFor: req.headers.get('x-forwarded-for'),
    realIp: req.headers.get('x-real-ip'),
  })
  return new NextResponse(r.corps, { status: r.statut, headers: { 'content-type': r.type, 'cache-control': 'no-store' } })
}

export const GET = passer
export const POST = passer
