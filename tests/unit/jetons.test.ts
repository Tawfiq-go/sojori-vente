import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculerValeurs, contientJeton, fenetre, prixRemise, resoudreContenu, resoudreTexte } from '../../lib/site/jetons.ts'

const fmt = (n: number, d: string, l: string) => `${n} ${d}${l === 'en' ? '/en' : ''}`
const A = 'a'.repeat(24)
const B = 'b'.repeat(24)
const jours = (prix: number[], min = 2) => prix.map((p, i) => ({ date: `2026-11-${10 + i}`, available: true, price: p, minStay: min }))
const v = calculerValeurs(
  [
    { id: A, jours: [...jours([1500, 1200]), { date: '2026-11-20', available: false, price: 500 }], devise: 'MAD' },
    { id: B, jours: jours([900], 3), devise: 'MAD' },
  ],
  { pourcent: 20, arrondi: 'dix' },
)

describe('valeurs réelles', () => {
  it('prend le plus bas des nuits LIBRES, jamais une nuit bloquée', () => {
    assert.equal(v.parLogement[A].prix, 1200)
    assert.equal(v.parLogement[B].nuitsMin, 3)
    assert.equal(v.disponibles, 2)
  })
  it('remise arrondie, bornée', () => {
    assert.equal(prixRemise(1333, 20, 'dix'), 1070)
    assert.equal(prixRemise(5, 90, 'dix'), 0)
  })
})

describe('remplacement', () => {
  it('tous les logements : le plus bas ; un logement : le sien', () => {
    assert.equal(resoudreTexte('dès {prix_a_partir}', v, 'fr', fmt), 'dès 900 MAD')
    assert.equal(resoudreTexte(`{prix_a_partir:${A}}`, v, 'fr', fmt), '1200 MAD')
    assert.equal(resoudreTexte('{prix_offre} au lieu de {prix_barre} ({remise})', v, 'fr', fmt), '720 MAD au lieu de 900 MAD (-20 %)')
    assert.equal(resoudreTexte('{nuits_min} nuits, {logements_disponibles}/{logements_total}', v, 'fr', fmt), '2 nuits, 2/2')
  })
  it('donnée absente : la chaîne disparaît, jamais un prix inventé', () => {
    const vide = calculerValeurs([{ id: A, jours: null, devise: 'MAD' }])
    for (const t of ['dès {prix_a_partir}', '{prix_offre}', '{remise}', '{nuits_min}', '{logements_disponibles}'])
      assert.equal(resoudreTexte(t, vide, 'fr', fmt), '', t)
    const sansRemise = calculerValeurs([{ id: A, jours: jours([1000]), devise: 'MAD' }])
    assert.equal(resoudreTexte('{prix_offre}', sansRemise, 'fr', fmt), '')
    assert.equal(resoudreTexte('{prix_a_partir}', sansRemise, 'fr', fmt), '1000 MAD')
  })
  it('aucune nuit libre : pas de prix, mais « 0 logement » est une information vraie', () => {
    const plein = calculerValeurs([{ id: A, jours: [{ date: '2026-11-10', available: false, price: 900 }], devise: 'MAD' }])
    assert.equal(resoudreTexte('{prix_a_partir}', plein, 'fr', fmt), '')
    assert.equal(resoudreTexte('{logements_disponibles}', plein, 'fr', fmt), '0')
  })
  it('un texte sans jeton est rendu tel quel', () => {
    assert.equal(resoudreTexte('Offre {inconnue} spéciale', v, 'fr', fmt), '')
    assert.equal(resoudreTexte('Black Friday', v, 'fr', fmt), 'Black Friday')
  })
  it('chaque langue est résolue dans sa langue, sans toucher aux ids ni aux liens', () => {
    const c = resoudreContenu({ id: 'x{prix_a_partir}', lien: '/reserver', valeur: { fr: '{prix_a_partir}', en: '{prix_a_partir}' }, code: 'BF20' }, v, 'fr', fmt)
    assert.deepEqual(c, { id: 'x{prix_a_partir}', lien: '/reserver', valeur: { fr: '900 MAD', en: '900 MAD/en' }, code: 'BF20' })
  })
  it('contientJeton évite tout appel inutile', () => {
    assert.equal(contientJeton({ a: 'Black Friday' }), false)
    assert.equal(contientJeton({ a: { fr: 'dès {prix_a_partir}' } }), true)
  })
})

describe('fenêtre de lecture', () => {
  const now = Date.parse('2026-11-21T10:00:00Z')
  it('de maintenant à la fin, 92 jours au plus', () => {
    assert.deepEqual(fenetre({ finUtc: '2026-11-30T22:59:00Z' }, now), { from: '2026-11-21', to: '2026-11-30' })
    assert.equal(fenetre({}, now)?.to, '2027-02-21')
  })
  it('offre à venir : à partir du début ; offre passée : rien', () => {
    assert.equal(fenetre({ debutUtc: '2026-11-26T23:00:00Z', finUtc: '2026-12-01T00:00:00Z' }, now)?.from, '2026-11-26')
    assert.equal(fenetre({ finUtc: '2026-11-01T00:00:00Z' }, now), null)
  })
})
