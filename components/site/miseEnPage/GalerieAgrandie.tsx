'use client'

/** Une galerie en mosaïque ; un clic agrandit la photo (Échap, flèches, clic à côté). Aucune adresse d'image n'est construite ici. */
import { useCallback, useEffect, useState } from 'react'

export function GalerieAgrandie({ photos, libelles }: { photos: ReadonlyArray<{ id: string; src: string }>; libelles: { fermer: string; avant: string; apres: string; photo: string } }) {
  const [i, setI] = useState<number | null>(null)
  const n = photos.length
  const aller = useCallback((pas: number) => setI((x) => (x === null ? x : (x + pas + n) % n)), [n])
  useEffect(() => {
    if (i === null) return
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setI(null)
      if (e.key === 'ArrowLeft') aller(-1)
      if (e.key === 'ArrowRight') aller(1)
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [i, aller])
  return (
    <>
      <div className="mep-boheme__grille" data-nombre={n}>
        {photos.map((p, k) => (
          <button key={p.id} type="button" onClick={() => setI(k)} aria-label={`${libelles.photo} ${k + 1}`}>
            <img src={p.src} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {i !== null && photos[i] && (
        <div className="mep-boheme__loupe" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setI(null)}>
          <button type="button" className="mep-boheme__loupe-fermer" onClick={() => setI(null)} aria-label={libelles.fermer}>
            ×
          </button>
          <button type="button" className="mep-boheme__loupe-avant" onClick={() => aller(-1)} aria-label={libelles.avant}>
            ‹
          </button>
          <img src={photos[i].src} alt="" />
          <button type="button" className="mep-boheme__loupe-apres" onClick={() => aller(1)} aria-label={libelles.apres}>
            ›
          </button>
        </div>
      )}
    </>
  )
}
