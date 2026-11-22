import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculerValeurs, contientJeton, contientJetonLogement, jetonsEmployes, prixServiceRemise, resoudreContenu, resoudreTexte } from '../../lib/site/jetons.ts'

// Le format reçoit des MAD (centimes / 100) : ici, un texte lisible et déterministe.
const fmt = (n: number, d: string, l: string) => `${n} ${d}${l === 'en' ? '/en' : ''}`
const base = calculerValeurs([], { pourcent: 20, arrondi: 'unite' })
const avec = (service: Record<string, unknown>) => ({ ...base, service }) as never
const massage = avec({ nom: { fr: 'Massage 60 min', en: 'Massage 60 min (EN)' }, prixCentimes: 35000, devise: 'MAD', commandable: true })

describe('jetons de service : valeurs lues en direct', () => {
  it('{service_nom} dans la langue demandée, sinon français', () => {
    assert.equal(resoudreTexte('{service_nom}', massage, 'fr', fmt), 'Massage 60 min')
    assert.equal(resoudreTexte('{service_nom}', massage, 'en', fmt), 'Massage 60 min (EN)')
    assert.equal(resoudreTexte('{service_nom}', massage, 'ar', fmt), 'Massage 60 min')
  })
  it('{service_prix} : le prix TTC du catalogue (centimes → MAD), jamais saisi', () => {
    assert.equal(resoudreTexte('dès {service_prix}', massage, 'fr', fmt), 'dès 350 MAD')
  })
  it('{service_prix_offre} : remise en centimes entiers, vers le bas, même règle que srv-site', () => {
    assert.equal(resoudreTexte('{service_prix_offre}', massage, 'fr', fmt), '280 MAD')
    const decimal = avec({ nom: { fr: 'X' }, prixCentimes: 35050, devise: 'MAD', commandable: true })
    assert.equal(resoudreTexte('{service_prix_offre}', decimal, 'fr', fmt), '280 MAD')
  })
  it('la remise ne s’applique JAMAIS à un service partenaire ou Mews (non commandable) : le texte disparaît', () => {
    const partenaire = avec({ nom: { fr: 'Navette' }, prixCentimes: 20000, devise: 'MAD', commandable: false })
    assert.equal(resoudreTexte('-20 % : {service_prix_offre}', partenaire, 'fr', fmt), '')
    // Son nom et son prix normal restent affichables.
    assert.equal(resoudreTexte('{service_nom} dès {service_prix}', partenaire, 'fr', fmt), 'Navette dès 200 MAD')
  })
  it('sans remise réglée, ou sans prix (carte, catalogue muet) : le TEXTE ENTIER disparaît, jamais un prix inventé', () => {
    const sansRemise = { ...calculerValeurs([]), service: { nom: { fr: 'X' }, prixCentimes: 35000, commandable: true } } as never
    assert.equal(resoudreTexte('{service_prix_offre}', sansRemise, 'fr', fmt), '')
    const carte = avec({ nom: { fr: 'Le Riad' }, commandable: false })
    assert.equal(resoudreTexte('{service_nom}', carte, 'fr', fmt), 'Le Riad')
    assert.equal(resoudreTexte('Dès {service_prix}', carte, 'fr', fmt), '')
    assert.equal(resoudreTexte('{service_nom}', base, 'fr', fmt), '')
    assert.equal(resoudreTexte('Offre {service_prix}', base, 'fr', fmt), '')
  })
  it('un prix à zéro ne montre pas d’« offre » ; la remise arrondie vers le bas ne remonte jamais au-dessus du prix', () => {
    const gratuit = avec({ nom: { fr: 'X' }, prixCentimes: 0, devise: 'MAD', commandable: true })
    assert.equal(resoudreTexte('{service_prix_offre}', gratuit, 'fr', fmt), '')
    const petit = avec({ nom: { fr: 'X' }, prixCentimes: 500, devise: 'MAD', commandable: true })
    assert.equal(resoudreTexte('{service_prix_offre}', petit, 'fr', fmt), '4 MAD')
  })
  it('un identifiant accolé à un jeton de service ne désigne rien (le texte disparaît)', () => {
    assert.equal(resoudreTexte(`{service_prix:${'a'.repeat(24)}}`, massage, 'fr', fmt), '')
  })
  it('dans tout un contenu, chaque langue est résolue dans sa langue', () => {
    const c = { accroche: { fr: '{service_nom} dès {service_prix}', en: '{service_nom} from {service_prix}' }, media: 'service:auto' }
    const r = resoudreContenu(c, massage, 'fr', fmt)
    assert.equal(r.accroche.fr, 'Massage 60 min dès 350 MAD')
    assert.equal(r.accroche.en, 'Massage 60 min (EN) from 350 MAD/en')
    assert.equal(r.media, 'service:auto') // une clé de média n'est jamais touchée
  })
})

describe('prix remisé d’une prestation : centimes entiers, vers le bas (parité avec srv-site)', () => {
  it('mêmes valeurs que prixServiceRemise de srv-site', () => {
    assert.equal(prixServiceRemise(35000, 20), 28000)
    assert.equal(prixServiceRemise(35000, 22), 27300)
    assert.equal(prixServiceRemise(35000, 22, 'cinq'), 27000)
    assert.equal(prixServiceRemise(35000, 22, 'dix'), 27000)
    assert.equal(prixServiceRemise(35050, 20), 28000)
    assert.equal(prixServiceRemise(350.5, 20), 350.5)
    for (const [c, p] of [[35000, 1], [10, 90], [0, 50], [99, 33]] as const) {
      const r = prixServiceRemise(c, p, 'dix')
      assert.ok(Number.isInteger(r) && r >= 0 && r <= c)
    }
  })
})

describe('les calendriers ne se lisent que pour un jeton de logement', () => {
  it('service seul ou {remise} : pas de lecture des calendriers', () => {
    assert.equal(contientJetonLogement({ a: '{service_nom} {service_prix} {service_prix_offre} {remise}' }), false)
    assert.equal(contientJetonLogement({ a: '{prix_a_partir}' }), true)
    assert.equal(contientJetonLogement({ a: '{service_nom} {nuits_min}' }), true)
    assert.equal(contientJeton({ a: '{service_nom}' }), true)
    assert.deepEqual(jetonsEmployes({ a: '{service_nom} {service_nom} {remise}' }).sort(), ['remise', 'service_nom'])
  })
})
