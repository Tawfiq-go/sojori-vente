/**
 * Le fond de toutes les cartes de sojori-vente (recherche, carte d'un logement, bloc « carte » des
 * sites de PM). Règle de Tawfiq (27/10/2026) : le Maroc complet, Sahara compris, jamais coupé en deux —
 * aucune frontière ni ligne pointillée à aucun zoom affiché. CARTO (clé exigée, « API KEY REQUIRED »)
 * et les tuiles OpenStreetMap standard (qui tracent la ligne du zoom 5 au zoom 12) sont donc exclus.
 *
 * Le fond est un style MapTiler à nous, sans couches de frontières ni étiquette « Western Sahara »,
 * servi en tuiles raster. Clé et style viennent de l'environnement (Vercel) ; la clé est limitée à nos
 * domaines dans le compte MapTiler. Sans clé : pas de fond du tout (les repères restent) — jamais un
 * fond qui couperait le Maroc.
 */
const CLE = (process.env.NEXT_PUBLIC_MAPTILER_KEY || '').trim()
const STYLE = (process.env.NEXT_PUBLIC_MAPTILER_STYLE || '').trim()

export type FondDeCarte = { url: string; attribution: string; maxZoom: number }

export const FOND_DE_CARTE: FondDeCarte | null =
  CLE && /^[A-Za-z0-9-]+$/.test(STYLE)
    ? {
        url: `https://api.maptiler.com/maps/${STYLE}/256/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CLE)}`,
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a> ' +
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>',
        maxZoom: 19,
      }
    : null
