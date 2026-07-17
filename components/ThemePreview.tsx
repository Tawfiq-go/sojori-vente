'use client'

/**
 * Mode preview des thèmes direct booking : `?theme=medina|riviera|desert`
 * applique le preset sur tout le site (persisté en sessionStorage pour
 * naviguer de page en page) ; `?theme=sojori` ou `?theme=off` revient au
 * défaut. Démo/vente uniquement — la résolution par domaine (multi-tenant)
 * remplacera ce mécanisme pour les vrais sites clients.
 */
import { useEffect } from 'react'
import { readTenantCookie } from '@/lib/tenantDomains'
import { fetchTenantPublic, getTenantSlug, type TenantPublic } from '@/lib/tenantPreview'
import { THEME_PRESETS, isThemeId, type ThemeId } from '@/lib/themes/presets'

/** Marque du tenant dans l'onglet : favicon = logo du PM, titre = nom du site.
 *  Ne remplace le titre que s'il porte encore la marque Sojori par défaut
 *  (les pages annonce gardent leur titre spécifique). */
function applyTenantBrand(pm: TenantPublic) {
  const name = pm.directBooking?.siteName || pm.name
  if (name && document.title.startsWith('Sojori')) {
    document.title = `${name} · Réservation en direct`
  }
  if (pm.vitrineLogoUrl) {
    for (const l of Array.from(document.querySelectorAll("link[rel*='icon']"))) l.remove()
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = pm.vitrineLogoUrl
    document.head.appendChild(link)
  }
}

const STORAGE_KEY = 'sojori_theme_preview'

function applyTheme(themeId: ThemeId) {
  const root = document.documentElement
  const preset = THEME_PRESETS[themeId]

  for (const preset2 of Object.values(THEME_PRESETS)) {
    for (const varName of Object.keys(preset2.vars)) {
      root.style.removeProperty(varName)
    }
  }
  for (const [varName, value] of Object.entries(preset.vars)) {
    root.style.setProperty(varName, value)
  }
  root.dataset.theme = themeId
}

export default function ThemePreview() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const fromUrl = params.get('theme')

      // Tenant actif (domaine client ou preview ?pm=) : favicon + titre à sa marque,
      // sur toutes les pages.
      const tenantSlug = getTenantSlug()
      if (tenantSlug) {
        void fetchTenantPublic(tenantSlug).then((pm) => {
          if (pm) applyTenantBrand(pm)
        })
      }

      const SHAPES = ['auto', 'arche', 'carre', 'arrondi', 'galbe']
      const shape = params.get('shape')
      if (shape && SHAPES.includes(shape)) {
        if (shape === 'auto') {
          sessionStorage.removeItem('sojori_shape_preview')
          delete document.documentElement.dataset.shape
        } else {
          sessionStorage.setItem('sojori_shape_preview', shape)
          document.documentElement.dataset.shape = shape
        }
      } else {
        const storedShape = sessionStorage.getItem('sojori_shape_preview')
        if (storedShape && SHAPES.includes(storedShape) && storedShape !== 'auto') {
          document.documentElement.dataset.shape = storedShape
        }
      }

      if (fromUrl === 'off' || fromUrl === 'sojori') {
        sessionStorage.removeItem(STORAGE_KEY)
        applyTheme('sojori')
        return
      }
      if (isThemeId(fromUrl)) {
        sessionStorage.setItem(STORAGE_KEY, fromUrl)
        applyTheme(fromUrl)
        return
      }

      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (isThemeId(stored)) {
        applyTheme(stored)
        return
      }

      // Domaine client (cookie du middleware) : appliquer le thème et la
      // forme SAUVÉS dans la config direct booking du PM — le site du client
      // porte sa charte sans aucun paramètre d'URL.
      const domainSlug = readTenantCookie()
      if (domainSlug) {
        void fetchTenantPublic(domainSlug).then((pm) => {
          const db = pm?.directBooking
          if (!db) return
          if (isThemeId(db.theme)) applyTheme(db.theme)
          if (db.shape && SHAPES.includes(db.shape) && db.shape !== 'auto') {
            document.documentElement.dataset.shape = db.shape
          }
        })
      }
    } catch {
      // preview best-effort — jamais bloquant
    }
  }, [])

  return null
}
