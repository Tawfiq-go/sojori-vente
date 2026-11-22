import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { MISES_EN_PAGE, TYPES_SERVICE, emplacementsVides, imageUtilisable, miseEnPage, misesEnPagePour, rendreEmplacement, variante } from '../../lib/site/miseEnPage.ts'

const ed = miseEnPage('editorial')!
const dip = miseEnPage('diptyque')!

describe('mises en page : catalogue', () => {
  it('six mises en page, identifiants uniques, au moins une par type de service, un emplacement principal quand il y a des photos', () => {
    assert.equal(MISES_EN_PAGE.length, 6)
    assert.equal(new Set(MISES_EN_PAGE.map((m) => m.id)).size, 6)
    for (const t of TYPES_SERVICE) assert.ok(misesEnPagePour(t).length > 0, t)
    for (const m of MISES_EN_PAGE) {
      if (m.emplacements.length) assert.equal(m.emplacements.filter((e) => e.principal).length, 1, m.id)
      assert.equal(new Set(m.emplacements.map((e) => e.id)).size, m.emplacements.length, m.id)
    }
  })
  it('chaque mise en page a son rendu (aucune mise en page sans composant)', () => {
    const rendu = readFileSync(new URL('../../components/site/miseEnPage/MisesEnPage.tsx', import.meta.url), 'utf8')
    for (const m of MISES_EN_PAGE) assert.match(rendu, new RegExp(`\\b${m.id}: `), m.id)
  })
  it('la typographique n’a aucun emplacement : toujours prête sans photo', () => {
    assert.deepEqual(miseEnPage('typographique')!.emplacements, [])
    assert.equal(variante(miseEnPage('typographique')!, {}), 'sans_image')
  })
})

describe('mises en page : choix selon le service et les photos disponibles', () => {
  it('brunch avec une photo : la carte du chef d’abord (faite pour le brunch)', () => {
    assert.equal(misesEnPagePour('brunch', 1)[0].id, 'carte_chef')
  })
  it('sans aucune photo : d’abord ce qui n’en demande pas (typographique), le reste ensuite sans être retiré', () => {
    const l = misesEnPagePour('brunch', 0)
    assert.equal(l[0].id, 'typographique')
    assert.ok(l.some((m) => m.id === 'carte_chef'))
  })
  it('piscine avec deux photos : le day pass passe avant le diptyque', () => {
    const ids = misesEnPagePour('piscine', 2).map((m) => m.id)
    assert.ok(ids.indexOf('day_pass') < ids.indexOf('diptyque'), ids.join())
  })
  it('jamais une mise en page qui n’est pas faite pour ce type (carte du chef pour une navette)', () => {
    assert.ok(!misesEnPagePour('navette', 5).some((m) => m.id === 'carte_chef'))
  })
})

describe('mises en page : générer SANS images, toujours publiable', () => {
  it('sans photo principale : variante sans image (public), même si une photo secondaire est posée', () => {
    assert.equal(variante(ed, {}), 'sans_image')
    assert.equal(variante(dip, { detail: 'https://x.example/d.jpg' }), 'sans_image')
    assert.equal(variante(dip, { ambiance: 'https://x.example/a.jpg' }), 'avec_images')
  })
  it('un emplacement vide : repli dessiné en APERÇU, rien au PUBLIC (jamais un trou ni une image cassée)', () => {
    assert.deepEqual(rendreEmplacement(undefined, true), { type: 'repli', etiquette: true })
    assert.deepEqual(rendreEmplacement(undefined, false), { type: 'aucun' })
    assert.deepEqual(rendreEmplacement('https://x.example/a.jpg', false), { type: 'photo', src: 'https://x.example/a.jpg' })
  })
  it('les emplacements vides, dans l’ordre', () => {
    assert.deepEqual(emplacementsVides(dip, { ambiance: 'https://x.example/a.jpg' }).map((e) => e.id), ['detail'])
    assert.deepEqual(emplacementsVides(dip, {}).map((e) => e.id), ['ambiance', 'detail'])
  })
  it('une image n’est posée que si l’adresse est sûre : https ou chemin local, jamais javascript:, data:, http ni guillemets', () => {
    for (const ok of ['https://cdn.example.com/a.webp', '/maquettes/a.webp']) assert.equal(imageUtilisable(ok), true, ok)
    for (const ko of ['javascript:alert(1)', 'data:image/png;base64,AAA', 'http://x.example/a.jpg', 'https://x.example/a.jpg") , url(evil', '//x.example/a.jpg', '', undefined, 42]) assert.equal(imageUtilisable(ko), false, String(ko))
    assert.deepEqual(rendreEmplacement('javascript:alert(1)', true), { type: 'repli', etiquette: true })
  })
})
