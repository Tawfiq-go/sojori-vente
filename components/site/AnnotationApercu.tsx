'use client'

/**
 * Le pont entre l'aperçu et le tableau de bord, par postMessage, seulement depuis ses origines :
 *  - `sojori:annoter` (lot 4) : un clic ne suit plus le lien, il renvoie la page et la section visées
 *    (`data-page`, `data-section`) à l'écran, qui en fait une note pour le chat ;
 *  - `sojori:rafraichir` (aperçu vivant, Tawfiq 27/10/2026 « comme Lovable ») : relit le brouillon
 *    sans recharger le cadre — même page, même défilement ;
 *  - `sojori:voir` {sectionId} : amène la section à l'écran et la souligne un instant.
 *  - `sojori:editer` {sectionId, champ} : « Modifier ici » (Tawfiq, 28/10/2026 : « je clique et je
 *    modifie directement le texte ») — le texte visé devient modifiable ; Entrée (ou sortir du
 *    champ) renvoie `sojori:texte` {pageId, sectionId, champ, texte}, Échap renvoie
 *    `sojori:texte_annule` et remet le texte. L'écran l'enregistre dans le brouillon.
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

const ID = /^[a-z0-9]{4,24}$/
/** Les textes que l'aperçu marque `data-champ` (Sections.tsx) : `titre`, `elements.2.libelle`… */
export const CHAMP = /^(?:surTitre|titre|sousTitre|texte|bouton|bouton2|(?:infos|elements)\.\d{1,2}\.(?:texte|valeur|libelle|auteur|nom|role|titre))$/

/** Le texte d'un élément tel qu'on l'écrit : espaces resserrés. */
const texteDe = (el: Element) => (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim()

export function AnnotationApercu() {
  const router = useRouter()
  useEffect(() => {
    let parent: string | null = null
    let edition: { el: HTMLElement; avant: string; pageId: string | null; sectionId: string; champ: string } | null =
      null
    const racine = document.querySelector('.site-pm')
    const surClic = (e: MouseEvent) => {
      if (!parent) return
      // Pendant « Modifier ici », un clic dans le texte place le curseur, il ne pose pas de note.
      if (edition && edition.el.contains(e.target as Node)) {
        e.preventDefault()
        return
      }
      const section = (e.target as Element | null)?.closest('[data-section]')
      if (!section) return
      e.preventDefault()
      e.stopPropagation()
      const titre = section.querySelector('h1, h2, h3, strong')?.textContent?.trim()
      const classe = String(section.className).split(' ').find((c) => c && c !== 'section') ?? ''
      const champ = (e.target as Element).closest('[data-champ]')
      const dansSection = champ && section.contains(champ) ? champ : null
      window.parent.postMessage(
        {
          type: 'sojori:note',
          pageId: section.closest('[data-page]')?.getAttribute('data-page') ?? null,
          sectionId: section.getAttribute('data-section'),
          quoi: [classe, titre ? `« ${titre.slice(0, 40)} »` : ''].filter(Boolean).join(' '),
          ...(dansSection
            ? { champ: dansSection.getAttribute('data-champ'), texte: texteDe(dansSection).slice(0, 2000) }
            : {}),
        },
        parent,
      )
    }
    const finir = (garder: boolean) => {
      const ed = edition
      if (!ed) return
      edition = null
      ed.el.removeAttribute('contenteditable')
      ed.el.classList.remove('en-edition')
      ed.el.removeEventListener('keydown', surTouche)
      ed.el.removeEventListener('blur', surSortie)
      const texte = texteDe(ed.el)
      if (!garder || !texte || texte === ed.avant) {
        ed.el.textContent = ed.avant
        if (parent) window.parent.postMessage({ type: 'sojori:texte_annule' }, parent)
        return
      }
      if (parent)
        window.parent.postMessage(
          { type: 'sojori:texte', pageId: ed.pageId, sectionId: ed.sectionId, champ: ed.champ, texte },
          parent,
        )
    }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finir(false)
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        finir(true)
      }
    }
    const surSortie = () => finir(true)
    const editer = (sectionId: string, champ: string) => {
      finir(false)
      const el = document.querySelector<HTMLElement>(`[data-section="${sectionId}"] [data-champ="${champ}"]`)
      if (!el) return
      edition = {
        el,
        avant: texteDe(el),
        pageId: el.closest('[data-page]')?.getAttribute('data-page') ?? null,
        sectionId,
        champ,
      }
      el.setAttribute('contenteditable', 'plaintext-only')
      if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true')
      el.classList.add('en-edition')
      el.addEventListener('keydown', surTouche)
      el.addEventListener('blur', surSortie)
      el.focus()
      const plage = document.createRange()
      plage.selectNodeContents(el)
      const choix = window.getSelection()
      choix?.removeAllRanges()
      choix?.addRange(plage)
    }
    const surMessage = (e: MessageEvent) => {
      if (!origineAdmise(e.origin, window.location.origin)) return
      const d = e.data as { type?: unknown; actif?: unknown; sectionId?: unknown } | null
      if (!d) return
      if (d.type === 'sojori:rafraichir') {
        router.refresh()
        return
      }
      if (d.type === 'sojori:voir' && typeof d.sectionId === 'string' && ID.test(d.sectionId)) {
        const cible = document.querySelector(`[data-section="${d.sectionId}"]`)
        cible?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cible?.classList.add('vient-de-changer')
        window.setTimeout(() => cible?.classList.remove('vient-de-changer'), 2400)
        return
      }
      if (d.type === 'sojori:editer') {
        const champ = (d as { champ?: unknown }).champ
        if (parent && typeof d.sectionId === 'string' && ID.test(d.sectionId) && typeof champ === 'string' && CHAMP.test(champ))
          editer(d.sectionId, champ)
        return
      }
      if (d.type !== 'sojori:annoter') return
      parent = d.actif === true ? e.origin : null
      if (!parent) finir(false)
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
