import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { MISES_EN_PAGE, REPLI_MARQUE, TYPES_SERVICE, couleurSure, emplacementsVides, imageUtilisable, imagesDesEmplacements, marqueSure, policeSure, miseEnPage, misesEnPagePour, rendreEmplacement, variante } from '../../lib/site/miseEnPage.ts'

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

describe('emplacements servis par srv-site : média du site ou photo du service', () => {
  const medias = { 'media:abc123': { url: 'https://cdn.example.com/a.webp', type: 'image' }, 'media:vid123': { url: 'https://cdn.example.com/v.mp4', type: 'video' }, 'media:http01': { url: 'http://cdn.example.com/h.jpg', type: 'image' } }
  it('media:<id> → adresse du média ; service:auto → photo du service lue en direct', () => {
    assert.deepEqual(imagesDesEmplacements({ lieu: 'media:abc123', detail: 'service:auto' }, medias, 'https://cdn.example.com/s.jpg'), {
      lieu: 'https://cdn.example.com/a.webp',
      detail: 'https://cdn.example.com/s.jpg',
    })
  })
  it('média inconnu, vidéo, adresse http, service sans photo : emplacement VIDE (jamais une autre image)', () => {
    assert.deepEqual(imagesDesEmplacements({ a: 'media:inconnu', b: 'media:vid123', c: 'media:http01', d: 'service:auto' }, medias, undefined), {})
    assert.deepEqual(imagesDesEmplacements(undefined, medias, 'https://x.example/s.jpg'), {})
    // Un chemin local n'est jamais servi depuis srv-site : seulement https.
    assert.deepEqual(imagesDesEmplacements({ a: 'service:auto' }, medias, '/maquettes/x.webp'), {})
  })
})

describe('style en ligne : couleurs et polices validées (aucune injection CSS)', () => {
  it('couleur #RRGGBB et police en clair passent', () => {
    assert.equal(couleurSure('#0D7A85', '#000000'), '#0D7A85')
    assert.equal(policeSure('Cormorant Garamond', 'Inter'), 'Cormorant Garamond')
  })
  it('une valeur piégée retombe sur le repli sûr', () => {
    for (const v of ['red; background:url(https://x.example/a)', '#0d7a85;color:red', 'rgb(0,0,0)', 'url(x)', '#0d7a8', '', 42, undefined])
      assert.equal(couleurSure(v, '#111111'), '#111111', String(v))
    for (const v of ["x'; background:url(https://x.example/a)", 'Inter;', 'Inter)', 'a'.repeat(41), "Playfair'", '', 7, undefined])
      assert.equal(policeSure(v, 'Inter'), 'Inter', String(v))
  })
  it('marqueSure remplace chaque champ piégé par son repli et garde les autres', () => {
    const r = marqueSure({ accent: '#c25c33', fond: 'x;y', texte: undefined, doux: '#eeeeee' }, { titre: "x'; background:url(z)", texte: 'Inter' })
    assert.deepEqual(r, {
      couleurs: { accent: '#c25c33', fond: REPLI_MARQUE.couleurs.fond, texte: REPLI_MARQUE.couleurs.texte, doux: '#eeeeee' },
      polices: { titre: REPLI_MARQUE.polices.titre, texte: 'Inter' },
    })
  })
  it('le rendu passe TOUJOURS par marqueSure avant le style en ligne', () => {
    const rendu = readFileSync(new URL('../../components/site/miseEnPage/MisesEnPage.tsx', import.meta.url), 'utf8')
    assert.match(rendu, /const d: DonneesLanding = \{ \.\.\.brut, \.\.\.marqueSure\(brut\.couleurs, brut\.polices\) \}/)
  })
})
