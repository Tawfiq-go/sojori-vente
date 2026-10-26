'use client'

/**
 * Le mode Annoter de l'aperçu (lot 4) : l'écran « Site web » du tableau de bord l'allume par
 * postMessage ; un clic sur le site ne suit plus le lien, il renvoie la page et la section visées
 * (`data-page`, `data-section`) à l'écran, qui en fait une note pour le chat. Seulement depuis les
 * origines du tableau de bord, et seulement dans l'aperçu.
 */
import { useEffect } from 'react'

const ORIGINES = new Set([
  'https://app.sojori.com',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
])

export function AnnotationApercu() {
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
      if (!ORIGINES.has(e.origin)) return
      const d = e.data as { type?: unknown; actif?: unknown } | null
      if (!d || d.type !== 'sojori:annoter') return
      parent = d.actif === true ? e.origin : null
      racine?.classList.toggle('annoter', Boolean(parent))
    }
    window.addEventListener('message', surMessage)
    document.addEventListener('click', surClic, true)
    return () => {
      window.removeEventListener('message', surMessage)
      document.removeEventListener('click', surClic, true)
    }
  }, [])
  return null
}
