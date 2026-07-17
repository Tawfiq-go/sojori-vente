'use client'

/**
 * Mode preview des thèmes direct booking : `?theme=medina|riviera|desert`
 * applique le preset sur tout le site (persisté en localStorage pour
 * naviguer de page en page) ; `?theme=sojori` ou `?theme=off` revient au
 * défaut. Démo/vente uniquement — la résolution par domaine (multi-tenant)
 * remplacera ce mécanisme pour les vrais sites clients.
 */
import { useEffect } from 'react'
import { THEME_PRESETS, isThemeId, type ThemeId } from '@/lib/themes/presets'

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

      if (fromUrl === 'off' || fromUrl === 'sojori') {
        localStorage.removeItem(STORAGE_KEY)
        applyTheme('sojori')
        return
      }
      if (isThemeId(fromUrl)) {
        localStorage.setItem(STORAGE_KEY, fromUrl)
        applyTheme(fromUrl)
        return
      }

      const stored = localStorage.getItem(STORAGE_KEY)
      if (isThemeId(stored)) applyTheme(stored)
    } catch {
      // preview best-effort — jamais bloquant
    }
  }, [])

  return null
}
