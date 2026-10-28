import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { GESTES, type Geste, corpsPermis } from '@/lib/site/assistant'
import { NextRequest, NextResponse } from 'next/server'

/**
 * La bulle de l'espace IA d'un site de PM → Réservation directe (srv-agents), côté serveur : le jeton
 * dédié (`DIRECT_WEB_TOKEN`) ne quitte jamais le serveur. Gestes en liste fermée, champs filtrés,
 * une limite par adresse IP (le reste des plafonds vit dans srv-agents : session, site, jour).
 */
const DELAI_MS = 45_000
const CORPS_MAX = 1_200_000 // un message vocal d'une minute en base64
const PAR_MINUTE = 30

const vus = new Map<string, { debut: number; n: number }>()
function tropDeDemandes(ip: string): boolean {
  const maintenant = Date.now()
  const v = vus.get(ip)
  if (!v || maintenant - v.debut > 60_000) {
    if (vus.size > 5_000) vus.clear()
    vus.set(ip, { debut: maintenant, n: 1 })
    return false
  }
  v.n += 1
  return v.n > PAR_MINUTE
}

async function relayer(req: NextRequest, geste: string) {
  const g = GESTES[geste as Geste]
  if (!g || g.methode !== req.method) return NextResponse.json({ success: false, error: 'geste_inconnu' }, { status: 404 })
  const jeton = (process.env.DIRECT_WEB_TOKEN || '').trim()
  if (!jeton) return NextResponse.json({ success: false, error: 'assistant_eteint' }, { status: 503 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'inconnue'
  if (tropDeDemandes(ip)) return NextResponse.json({ success: false, error: 'trop_de_demandes' }, { status: 429 })

  const base = `${getRemoteApiBaseUrl()}/api/v1/agents/direct/web/${g.chemin}`
  const entetes = { 'x-direct-web-token': jeton, 'content-type': 'application/json' }
  let cible = base
  const init: RequestInit = { method: g.methode, headers: entetes, signal: AbortSignal.timeout(DELAI_MS), cache: 'no-store' }
  if (g.methode === 'GET') {
    const q = new URLSearchParams(corpsPermis(Object.fromEntries(req.nextUrl.searchParams)))
    cible = `${base}?${q.toString()}`
  } else {
    const brut = await req.text()
    if (brut.length > CORPS_MAX) return NextResponse.json({ success: false, error: 'trop_long' }, { status: 413 })
    let lu: unknown = null
    try {
      lu = JSON.parse(brut)
    } catch {
      return NextResponse.json({ success: false, error: 'demande_invalide' }, { status: 400 })
    }
    init.body = JSON.stringify(corpsPermis(lu))
  }
  try {
    const r = await fetch(cible, init)
    const corps = await r.text()
    return new NextResponse(corps, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'assistant_indisponible' }, { status: 503 })
  }
}

type Contexte = { params: Promise<{ geste: string }> }

export async function GET(req: NextRequest, ctx: Contexte) {
  return relayer(req, (await ctx.params).geste)
}

export async function POST(req: NextRequest, ctx: Contexte) {
  return relayer(req, (await ctx.params).geste)
}
