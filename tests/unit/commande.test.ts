import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, beforeEach, describe, it } from 'node:test'
import { codeErreur, commandeAllumee, geste, ipDuVisiteur, lienOuvrable, limiteur, montantMad, panneauCommande, relayer } from '../../lib/site/commande.ts'

const ID = 'ab'.repeat(12)
const prestationEnCours = { etat: 'en_cours', service: { forme: 'prestation' }, serviceLu: { commandable: true } }

describe('panneau de commande : quand il apparaît', () => {
  it('landing en cours + prestation commandable + interrupteur allumé + hors aperçu', () => {
    assert.equal(panneauCommande(prestationEnCours, false, true), true)
  })
  it('éteint : jamais (le comportement d’avant est inchangé)', () => {
    assert.equal(panneauCommande(prestationEnCours, false, false), false)
  })
  it('aperçu : jamais (aucune commande depuis un brouillon)', () => {
    assert.equal(panneauCommande(prestationEnCours, true, true), false)
  })
  it('pas en cours (à venir, terminée), carte de restaurant, service non commandable (partenaire, Mews), sans service lu : jamais', () => {
    assert.equal(panneauCommande({ ...prestationEnCours, etat: 'a_venir' }, false, true), false)
    assert.equal(panneauCommande({ ...prestationEnCours, etat: 'terminee' }, false, true), false)
    assert.equal(panneauCommande({ ...prestationEnCours, service: { forme: 'carte' } }, false, true), false)
    assert.equal(panneauCommande({ ...prestationEnCours, serviceLu: { commandable: false } }, false, true), false)
    assert.equal(panneauCommande({ etat: 'en_cours', service: { forme: 'prestation' } }, false, true), false)
    assert.equal(panneauCommande(undefined, false, true), false)
  })
  it('l’interrupteur : exactement « 1 »', () => {
    assert.equal(commandeAllumee({ SITE_COMMANDE_LANDING: '1' }), true)
    for (const v of [undefined, '', '0', 'true', 'oui', ' ']) assert.equal(commandeAllumee({ SITE_COMMANDE_LANDING: v }), false, String(v))
    assert.equal(commandeAllumee({ SITE_COMMANDE_LANDING: ' 1 ' }), true)
  })
})

describe('gestes : liste fermée', () => {
  it('les trois gestes, avec le chemin srv-site', () => {
    assert.deepEqual(geste('GET', 'pm-test', 'page_1', ['creneaux']), { methode: 'GET', chemin: 'pm/pm-test/landings/page_1/commande/creneaux' })
    assert.deepEqual(geste('POST', 'pm-test', 'page_1', ['commande']), { methode: 'POST', chemin: 'pm/pm-test/landings/page_1/commande' })
    assert.deepEqual(geste('POST', 'pm-test', 'page_1', ['commande', ID.toUpperCase(), 'paiement']), { methode: 'POST', chemin: `pm/pm-test/landings/page_1/commande/${ID}/paiement` })
  })
  it('tout le reste est refusé : mauvaise méthode, geste inconnu, identifiant invalide, slug ou page forgés (../, espaces, trop longs)', () => {
    assert.equal(geste('POST', 'pm-test', 'p', ['creneaux']), null)
    assert.equal(geste('GET', 'pm-test', 'p', ['commande']), null)
    assert.equal(geste('GET', 'pm-test', 'p', ['commande', ID, 'paiement']), null)
    assert.equal(geste('POST', 'pm-test', 'p', ['commande', 'pas-un-id', 'paiement']), null)
    assert.equal(geste('POST', 'pm-test', 'p', ['commande', ID, 'paiement', 'x']), null)
    assert.equal(geste('DELETE', 'pm-test', 'p', ['commande']), null)
    assert.equal(geste('POST', '../admin', 'p', ['commande']), null)
    assert.equal(geste('POST', 'PM', 'p', ['commande']), null)
    assert.equal(geste('POST', 'pm-test', 'a/b', ['commande']), null)
    assert.equal(geste('POST', 'pm-test', 'x'.repeat(81), ['commande']), null)
    assert.equal(geste('POST', 'pm-test', '', ['commande']), null)
  })
})

describe('adresse du visiteur, limite, erreurs, lien', () => {
  it('la DERNIÈRE adresse de x-forwarded-for gagne (jamais l’entrée forgée à gauche), sinon x-real-ip', () => {
    assert.equal(ipDuVisiteur('6.6.6.6, 1.2.3.4', null), '1.2.3.4')
    assert.equal(ipDuVisiteur(null, '5.5.5.5'), '5.5.5.5')
    assert.equal(ipDuVisiteur('', ''), '')
    assert.equal(ipDuVisiteur('x'.repeat(200), null).length, 64)
  })
  it('limite par adresse et par fenêtre', () => {
    let t = 0
    const trop = limiteur(2, 1000, () => t)
    assert.deepEqual([trop('a'), trop('a'), trop('a')], [false, false, true])
    assert.equal(trop('b'), false)
    t = 1500
    assert.equal(trop('a'), false)
  })
  it('codes d’erreur connus ou « autre » ; lien de paiement https seulement', () => {
    assert.equal(codeErreur('CRENEAU_COMPLET'), 'CRENEAU_COMPLET')
    assert.equal(codeErreur('MongoError xyz'), 'autre')
    assert.equal(codeErreur(undefined), 'autre')
    assert.equal(lienOuvrable('https://pay.example/pay?t=1'), true)
    for (const v of ['http://x', 'javascript:alert(1)', 'https://', '', 5, null, 'https://a b']) assert.equal(lienOuvrable(v), false, String(v))
  })
  it('montant rendu par le serveur, sans décimales inutiles', () => {
    assert.match(montantMad(28000, 'MAD', 'fr'), /280/)
    assert.match(montantMad(28050, 'MAD', 'fr'), /280[,.]50/)
  })
})

describe('relais serveur vers srv-site (vrai faux serveur HTTP)', () => {
  let faux: http.Server
  let recus: Array<{ methode: string; url: string; entetes: http.IncomingHttpHeaders; corps: string }> = []
  let repondre: () => { statut: number; corps: string } = () => ({ statut: 200, corps: '{"success":true,"data":{}}' })
  let env: Record<string, string | undefined> = {}
  const demande = (extra: Record<string, unknown> = {}) => ({ methode: 'POST', slug: 'pm-test', pageId: 'page_1', suite: ['commande'], recherche: new URLSearchParams(), corps: '{"client":{"nom":"Y"}}', forwardedFor: '8.8.8.8', realIp: null, ...extra }) as Parameters<typeof relayer>[0]

  before(async () => {
    faux = http.createServer((req, res) => {
      const morceaux: Buffer[] = []
      req.on('data', (d) => morceaux.push(d))
      req.on('end', () => {
        recus.push({ methode: req.method ?? '', url: req.url ?? '', entetes: req.headers, corps: Buffer.concat(morceaux).toString() })
        const r = repondre()
        res.writeHead(r.statut, { 'content-type': 'application/json' })
        res.end(r.corps)
      })
    })
    await new Promise<void>((ok) => faux.listen(0, '127.0.0.1', ok))
  })
  after(() => faux.close())
  beforeEach(() => {
    recus = []
    repondre = () => ({ statut: 201, corps: '{"success":true,"data":{"commandeId":"x","totalCentimes":28000}}' })
    env = { SITE_COMMANDE_LANDING: '1', SITE_API_URL: `http://127.0.0.1:${(faux.address() as AddressInfo).port}/api/v1/public/sites` }
  })

  it('ÉTEINT : 404, aucun appel', async () => {
    const r = await relayer(demande(), { ...env, SITE_COMMANDE_LANDING: undefined })
    assert.equal(r.statut, 404)
    assert.equal(recus.length, 0)
  })
  it('un geste inconnu : 404 sans appel', async () => {
    assert.equal((await relayer(demande({ suite: ['admin'] }), env)).statut, 404)
    assert.equal((await relayer(demande({ slug: '../x' }), env)).statut, 404)
    assert.equal(recus.length, 0)
  })
  it('la commande part vers le bon chemin srv-site, avec l’adresse du visiteur, le corps tel quel ; la réponse revient telle quelle', async () => {
    const r = await relayer(demande(), env)
    assert.equal(r.statut, 201)
    assert.deepEqual(JSON.parse(r.corps), { success: true, data: { commandeId: 'x', totalCentimes: 28000 } })
    assert.equal(recus[0].methode, 'POST')
    assert.equal(recus[0].url, '/api/v1/public/sites/pm/pm-test/landings/page_1/commande')
    assert.equal(recus[0].entetes['x-forwarded-for'], '8.8.8.8')
    assert.equal(recus[0].corps, '{"client":{"nom":"Y"}}')
  })
  it('les créneaux : GET, seule la date est transmise', async () => {
    repondre = () => ({ statut: 200, corps: '{"success":true,"data":{"creneaux":[]}}' })
    await relayer(demande({ methode: 'GET', suite: ['creneaux'], corps: null, recherche: new URLSearchParams('date=2030-01-01&ownerId=evil&id=1') }), env)
    assert.equal(recus[0].methode, 'GET')
    assert.equal(recus[0].url, '/api/v1/public/sites/pm/pm-test/landings/page_1/commande/creneaux?date=2030-01-01')
  })
  it('soirée : l’indice de formule (un chiffre de 0 à 5) suit la date ; toute autre valeur est ignorée', async () => {
    await relayer(demande({ methode: 'GET', suite: ['creneaux'], corps: null, recherche: new URLSearchParams('date=2030-01-01&formule=2') }), env)
    assert.equal(recus[0].url, '/api/v1/public/sites/pm/pm-test/landings/page_1/commande/creneaux?date=2030-01-01&formule=2')
    for (const f of ['9', '01', '-1', 'x', '2&ownerId=evil']) {
      recus = []
      await relayer(demande({ methode: 'GET', suite: ['creneaux'], corps: null, recherche: new URLSearchParams(`date=2030-01-01&formule=${encodeURIComponent(f)}`) }), env)
      assert.equal(recus[0].url, '/api/v1/public/sites/pm/pm-test/landings/page_1/commande/creneaux?date=2030-01-01', f)
    }
  })
  it('une date trop longue ou piégée est coupée à 10 caractères avant d’être transmise', async () => {
    await relayer(demande({ methode: 'GET', suite: ['creneaux'], corps: null, recherche: new URLSearchParams('date=2030-01-01%26ownerId%3Devil') }), env)
    assert.equal(recus[0].url, '/api/v1/public/sites/pm/pm-test/landings/page_1/commande/creneaux?date=2030-01-01')
  })
  it('le lien de paiement : POST sur la commande du chemin', async () => {
    await relayer(demande({ suite: ['commande', ID, 'paiement'], corps: '{}' }), env)
    assert.equal(recus[0].url, `/api/v1/public/sites/pm/pm-test/landings/page_1/commande/${ID}/paiement`)
  })
  it('corps trop long (413), corps illisible ou qui n’est pas un objet (400) : refusés ICI, sans appel', async () => {
    assert.equal((await relayer(demande({ corps: `{"a":"${'x'.repeat(4100)}"}` }), env)).statut, 413)
    assert.equal((await relayer(demande({ corps: '{pas du json' }), env)).statut, 400)
    assert.equal((await relayer(demande({ corps: '[1]' }), env)).statut, 400)
    assert.equal((await relayer(demande({ corps: '"x"' }), env)).statut, 400)
    assert.equal(recus.length, 0)
  })
  it('limite par adresse : au-delà de 12 commandes par minute, 429 sans appel', async () => {
    const ip = '4.4.4.4'
    for (let i = 0; i < 12; i++) assert.equal((await relayer(demande({ forwardedFor: ip }), env)).statut, 201)
    const n = recus.length
    assert.equal((await relayer(demande({ forwardedFor: ip }), env)).statut, 429)
    assert.equal(recus.length, n)
    assert.equal((await relayer(demande({ forwardedFor: '4.4.4.5' }), env)).statut, 201)
  })
  it('les créneaux ont aussi une limite par adresse (60 par minute), séparée de celle des commandes', async () => {
    repondre = () => ({ statut: 200, corps: '{"success":true,"data":{"creneaux":[]}}' })
    const lecture = (ip: string) => relayer(demande({ methode: 'GET', suite: ['creneaux'], corps: null, forwardedFor: ip, recherche: new URLSearchParams('date=2030-01-01') }), env)
    for (let i = 0; i < 60; i++) assert.equal((await lecture('2.2.2.2')).statut, 200)
    const n = recus.length
    assert.equal((await lecture('2.2.2.2')).statut, 429)
    assert.equal(recus.length, n)
    assert.equal((await lecture('2.2.2.3')).statut, 200)
    // Les lectures ne consomment pas le budget des commandes de la même adresse.
    repondre = () => ({ statut: 201, corps: '{"success":true,"data":{}}' })
    assert.equal((await relayer(demande({ forwardedFor: '2.2.2.2' }), env)).statut, 201)
  })
  it('les erreurs de srv-site passent avec leur statut ; srv-site injoignable : 503 commande_indisponible', async () => {
    repondre = () => ({ statut: 409, corps: '{"success":false,"error":"CRENEAU_COMPLET"}' })
    const r = await relayer(demande({ forwardedFor: '3.3.3.3' }), env)
    assert.deepEqual([r.statut, JSON.parse(r.corps).error], [409, 'CRENEAU_COMPLET'])
    const mort = await relayer(demande({ forwardedFor: '3.3.3.4' }), { ...env, SITE_API_URL: 'http://127.0.0.1:1/api/v1/public/sites' })
    assert.deepEqual([mort.statut, JSON.parse(mort.corps).error], [503, 'commande_indisponible'])
  })
})

describe('événement : le panneau de réservation', () => {
  it('une landing d’événement en vente a son panneau ; fermé, en aperçu ou éteint : non', () => {
    const evt = { etat: 'en_cours', service: { forme: 'evenement' }, serviceLu: { commandable: true } }
    assert.equal(panneauCommande(evt, false, true), true)
    assert.equal(panneauCommande({ ...evt, serviceLu: { commandable: false } }, false, true), false)
    assert.equal(panneauCommande(evt, true, true), false)
    assert.equal(panneauCommande(evt, false, false), false)
    assert.equal(panneauCommande({ ...evt, service: { forme: 'carte' } }, false, true), false)
  })
})

