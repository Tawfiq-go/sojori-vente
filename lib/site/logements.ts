import type { Logement } from './types'

/**
 * « Le plus beau logement » du PM, pour la photo plein écran de son premier écran : celui qui a des
 * photos et la meilleure note, puis le plus de photos, puis le premier de sa liste. Un logement sans
 * photo n'est jamais choisi ; aucun logement avec photo : `null` (le bandeau garde sa couleur).
 */
export function plusBeauLogement(logements: Logement[]): Logement | null {
  const avecPhoto = logements.filter((l) => typeof l.images?.[0] === 'string' && l.images[0])
  if (!avecPhoto.length) return null
  return avecPhoto.reduce((meilleur, l) => {
    const note = (x: Logement) => (typeof x.rating === 'number' && Number.isFinite(x.rating) ? x.rating : 0)
    if (note(l) !== note(meilleur)) return note(l) > note(meilleur) ? l : meilleur
    return (l.images?.length ?? 0) > (meilleur.images?.length ?? 0) ? l : meilleur
  })
}
