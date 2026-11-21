/**
 * Les champs dynamiques d'une landing, côté serveur : lit les calendriers (prix, disponibilité, séjour minimal) des
 * logements de l'offre sur les routes publiques de srv-listing — les mêmes que le moteur `/reserver` —, puis remplace
 * les jetons du contenu (lib/site/jetons.ts). Aucun calcul de prix ici, aucun service payant, aucun cron : lecture à
 * chaque rendu de la page, cache de 20 s (comme le moteur). Même résolution pour l'aperçu et le public.
 *
 * Périmètre : `offre.logements` (12 au plus) ; sinon les 12 premiers logements du PM. Un identifiant qui n'est pas
 * dans la liste publique de CE PM est ignoré (jamais le logement d'un autre propriétaire). Un échec de lecture ne
 * casse rien : le calendrier vaut `null`, les champs concernés disparaissent.
 */
import { getRemoteApiBaseUrl } from '@/lib/config/apiBase'
import { lireLogements } from './api'
import { type Jour, type LogementLu, calculerValeurs, contientJeton, fenetre, resoudreContenu } from './jetons'
import { prix } from './texte'
import type { Langue, Page } from './types'

const PERIMETRE_MAX = 12

async function lireJours(slug: string, id: string, from: string, to: string): Promise<Jour[] | null> {
  try {
    const qs = new URLSearchParams({ from, to, pm: slug })
    const r = await fetch(`${getRemoteApiBaseUrl()}/api/v1/listing/public/listings/${encodeURIComponent(id)}/calendar?${qs}`, {
      next: { revalidate: 20, tags: [`logements:${slug}`] },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const jours = ((await r.json()) as { data?: { days?: unknown } }).data?.days
    if (!Array.isArray(jours)) return null
    return jours.flatMap((j): Jour[] => {
      const o = j as Record<string, unknown>
      if (typeof o?.date !== 'string') return []
      return [
        {
          date: o.date,
          ...(typeof o.available === 'boolean' ? { available: o.available } : {}),
          ...(typeof o.price === 'number' ? { price: o.price } : {}),
          ...(typeof o.minStay === 'number' ? { minStay: o.minStay } : {}),
          ...(typeof o.stopSell === 'boolean' ? { stopSell: o.stopSell } : {}),
        },
      ]
    })
  } catch {
    return null
  }
}

/** La page avec ses jetons remplacés par les vraies valeurs ; la page telle quelle si elle n'en emploie aucun. */
export async function pageAvecChampsDynamiques(slug: string, page: Page, langue: Langue, maintenantMs = Date.now()): Promise<Page> {
  if (!page.offre || !contientJeton(page.sections)) return page
  const offre = page.offre
  const sien = await lireLogements(slug)
  const voulus = offre.logements?.length ? sien.filter((l) => offre.logements?.includes(l.id)) : sien
  const perimetre = voulus.slice(0, PERIMETRE_MAX)
  const fen = fenetre(offre, maintenantMs)
  const lus: LogementLu[] = await Promise.all(
    perimetre.map(async (l) => ({ id: l.id, devise: l.currency || 'MAD', jours: fen ? await lireJours(slug, l.id, fen.from, fen.to) : null })),
  )
  const valeurs = calculerValeurs(lus, offre.remise)
  return { ...page, sections: resoudreContenu(page.sections, valeurs, langue, prix) }
}
