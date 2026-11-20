// Vérifie que la page de réservation d'un site de PM est STABLE après le choix des dates : aucune navigation en boucle,
// aucune requête vers le marché (/search, /api/sojori), aucune mutation du DOM, le bouton ne change pas d'aspect.
// Usage : node scripts/verifier-reserver-stable.mjs "<url de /reserver avec checkIn, checkOut, adults>" [pc|mobile]
// Code de sortie 1 au moindre écart. (Bug du 20/11/2026 : l'ancienne liste du marché faisait router.replace('/search…').)
import { chromium } from '@playwright/test'

const url = process.argv[2]
const appareil = process.argv[3] === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 }
if (!url) {
  console.error('URL manquante')
  process.exit(2)
}
const navigateur = await chromium.launch()
const page = await navigateur.newPage({ viewport: appareil })
const navigations = []
let chargements = 0
const requetesMarche = []
page.on('load', () => chargements++)
// Les navigations dans le même document (history.replaceState de Next) ne comptent pas : seuls comptent les chargements et les chemins visités.
page.on('framenavigated', (f) => f === page.mainFrame() && navigations.push(f.url()))
page.on('request', (r) => {
  const u = new URL(r.url())
  if (u.pathname.startsWith('/search') || u.pathname.startsWith('/api/sojori')) requetesMarche.push(u.pathname)
})
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => {
  window.__mutations = 0
  window.__styles = new Set()
  new MutationObserver((m) => (window.__mutations += m.length)).observe(document.body, { subtree: true, childList: true, attributes: true })
  const b = document.querySelector('.moteur-sejour .bouton')
  const t0 = performance.now()
  const f = () => {
    if (b) {
      const c = getComputedStyle(b)
      const r = b.getBoundingClientRect()
      window.__styles.add([c.opacity, c.backgroundColor, c.color, c.transform, Math.round(r.top + scrollY), Math.round(r.width)].join('|'))
    }
    if (performance.now() - t0 < 5000) requestAnimationFrame(f)
  }
  f()
})
await page.waitForTimeout(5500)
const mesure = await page.evaluate(() => ({ mutations: window.__mutations, stylesDistincts: window.__styles.size }))
await navigateur.close()
const rapport = { url: url.replace(/\?.*/, ''), appareil: `${appareil.width}px`, chargements, cheminsVisites: [...new Set(navigations.map((u) => new URL(u).pathname))].length, requetesMarche: requetesMarche.length, ...mesure }
console.log(JSON.stringify(rapport))
const ok = chargements === 1 && rapport.cheminsVisites === 1 && requetesMarche.length === 0 && mesure.mutations === 0 && mesure.stylesDistincts <= 1
console.log(ok ? 'STABLE' : 'INSTABLE')
process.exit(ok ? 0 : 1)
