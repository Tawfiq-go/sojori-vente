// Garde du build (27/10/2026) : le fond de carte passe par lib/geo/fondDeCarte.ts (style MapTiler sans
// frontières). Interdits : CARTO (clé exigée, « API KEY REQUIRED ») et les tuiles OpenStreetMap
// standard, qui tracent la ligne Maroc / Sahara du zoom 5 au zoom 12 (règle de Tawfiq : Maroc complet).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DOSSIERS = ['app', 'components', 'lib']
const INTERDIT = /cartocdn|tile\.openstreetmap\.org/i
const fautes = []
const parcourir = (d) => {
  for (const nom of readdirSync(d)) {
    const p = join(d, nom)
    if (statSync(p).isDirectory()) parcourir(p)
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(nom) && INTERDIT.test(readFileSync(p, 'utf8'))) fautes.push(p)
  }
}
for (const d of DOSSIERS) parcourir(d)
if (fautes.length) {
  console.error(`Fond de carte interdit (CARTO ou tuiles OSM standard) — passer par lib/geo/fondDeCarte.ts :\n  ${fautes.join('\n  ')}`)
  process.exit(1)
}
console.log('fond de carte : ni CARTO ni tuiles OSM standard')
