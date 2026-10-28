'use client'

/**
 * Le pont entre l'aperçu et le tableau de bord, par postMessage, seulement depuis ses origines :
 *  - `sojori:annoter` (lot 4) : un clic ne suit plus le lien, il renvoie la page et la section visées
 *    (`data-page`, `data-section`) à l'écran, qui en fait une note pour le chat ;
 *  - `sojori:rafraichir` (aperçu vivant, Tawfiq 27/10/2026 « comme Lovable ») : relit le brouillon
 *    sans recharger le cadre — même page, même défilement ;
 *  - `sojori:voir` {sectionId} : amène la section à l'écran et la souligne un instant.
 * Dans l'autre sens, `sojori:pret` dit au tableau de bord que l'écoute est en place : le cadre a
 * fini de charger avant que React l'ait branchée, et un `sojori:annoter` envoyé au chargement se
 * perdait (recette du 28/10/2026 : Annoter allumé, aucun clic ne revenait).
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Les origines qui peuvent encadrer le site (frame-ancestors de next.config.ts), pas plus. */
const ORIGINES = new Set(['https://app.sojori.com', 'https://admin.sojori.com'])

/**
 * Une origine du tableau de bord, ou la page elle-même : en local, le serveur de dev du tableau de
 * bord relaie l'aperçu sous sa propre adresse (même origine), sans localhost dans frame-ancestors.
 */
export const origineAdmise = (origine: string, ici: string): boolean =>
  ORIGINES.has(origine) || origine === ici

export function AnnotationApercu() {
  const router = useRouter()
  useEffect(() => {
    let parent: string | null = null
    const racine = document.querySelector('.site-pm')
    const surClic = (e: MouseEvent) => {
      if (!parent) return
      const section = (e.target as Element | null)?.closest('[data-section]')
      if (!section) return
      e.preventDefault()
      e.stopPropagation()
      const titre = section.querySelector('h1, h2, h3, strong')?.textContent?.trim()
      const classe = String(section.className).split(' ').find((c) => c && c !== 'section') ?? ''
      window.parent.postMessage(
        {
          type: 'sojori:note',
          pageId: section.closest('[data-page]')?.getAttribute('data-page') ?? null,
          sectionId: section.getAttribute('data-section'),
          quoi: [classe, titre ? `« ${titre.slice(0, 40)} »` : ''].filter(Boolean).join(' '),
        },
        parent,
      )
    }
    const surMessage = (e: MessageEvent) => {
      if (!origineAdmise(e.origin, window.location.origin)) return
      const d = e.data as { type?: unknown; actif?: unknown; sectionId?: unknown } | null
      if (!d) return
      if (d.type === 'sojori:rafraichir') {
        router.refresh()
        return
      }
      if (d.type === 'sojori:voir' && typeof d.sectionId === 'string' && /^[a-z0-9]{4,24}$/.test(d.sectionId)) {
        const cible = document.querySelector(`[data-section="${d.sectionId}"]`)
        cible?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cible?.classList.add('vient-de-changer')
        window.setTimeout(() => cible?.classList.remove('vient-de-changer'), 2400)
        return
      }
      if (d.type !== 'sojori:annoter') return
      parent = d.actif === true ? e.origin : null
      racine?.classList.toggle('annoter', Boolean(parent))
    }
    window.addEventListener('message', surMessage)
    document.addEventListener('click', surClic, true)
    if (window.parent !== window)
      for (const o of [...ORIGINES, window.location.origin])
        window.parent.postMessage({ type: 'sojori:pret' }, o)
    return () => {
      window.removeEventListener('message', surMessage)
      document.removeEventListener('click', surClic, true)
    }
  }, [router])
  return null
}
