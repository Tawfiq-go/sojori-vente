import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { choisirMode, codeDit, corpsReservation, creer, hotePaiementOk, lienOuvrable, lireDemande, reservationEnLigne, sitesEnLigne, traiter, type Deps } from '../../lib/site/reservation.ts'

const L = 'ab'.repeat(12)
const R = 'cd'.repeat(12)
const bon = { typeId: `${L}:${R}`, checkIn: '2026-12-23', checkOut: '2026-12-25', adults: 2, prenom: 'Aïcha', nom: 'Ben', email: 'a@b.ma', telephone: '+212 600 000 000' }
const detail = { baseNights: 2, basePrice: 4000, weekendNights: 0, weekendPrice: 0, subtotal: 8000, serviceFee: 800, tax: 240, total: 9040 }

describe('réservation en ligne : l’interrupteur est PAR SITE et éteint par défaut', () => {
  it('rien dans la liste = aucun site ouvert (comportement WhatsApp d’avant)', () => {
    assert.equal(reservationEnLigne('nommos', {}), false)
    assert.equal(reservationEnLigne('nommos', { SITE_RESERVATION_LIGNE_SLUGS: '' }), false)
  })
  it('seul le slug listé est ouvert ; les autres sites ne changent pas ; entrées invalides ignorées', () => {
    const env = { SITE_RESERVATION_LIGNE_SLUGS: ' Nommos , autre-site,,x,pas un slug' }
    assert.equal(reservationEnLigne('nommos', env), true)
    assert.equal(reservationEnLigne('NOMMOS', env), true)
    assert.equal(reservationEnLigne('siyahai', env), false)
    assert.deepEqual([...sitesEnLigne(env)].sort(), ['autre-site', 'nommos'])
  })
})

describe('demande du navigateur : strictement validée, rien « réparé » en silence', () => {
  it('une demande valide est acceptée', () => {
    const d = lireDemande(JSON.stringify(bon))
    assert.equal(d?.adults, 2)
    assert.equal(d?.typeId, `${L}:${R}`)
  })
  it('hors forme : refusée', () => {
    const mauvais: Array<Record<string, unknown>> = [
      { typeId: 'pas-un-id' },
      { typeId: `${L}:${R}:${R}` },
      { checkIn: '23/12/2026' },
      { adults: 0 },
      { adults: 21 },
      { adults: 1.5 },
      { email: 'pas-un-email' },
      { email: '' },
      { telephone: 'abc' },
      { prenom: '' },
      { nom: 'x'.repeat(61) },
      { arrivee: '25:99' },
    ]
    for (const m of mauvais) assert.equal(lireDemande(JSON.stringify({ ...bon, ...m })), null, JSON.stringify(m))
    assert.equal(lireDemande('pas du json'), null)
    assert.equal(lireDemande('[]'), null)
    assert.equal(lireDemande('x'.repeat(5000)), null)
  })
  it('le navigateur ne peut PAS imposer un prix, un compte ou un canal : ces champs n’existent pas dans la demande', () => {
    const d = lireDemande(JSON.stringify({ ...bon, total: 1, pricing: { total: 1 }, payment: { method: 'later' }, ownerId: 'x', paymentAccountId: 'y' }))
    assert.ok(d)
    assert.deepEqual(Object.keys(d).sort(), ['adults', 'checkIn', 'checkOut', 'email', 'nom', 'prenom', 'telephone', 'typeId'])
  })
})

describe('corps envoyé à srv-reservations', () => {
  const d = lireDemande(JSON.stringify(bon))!
  const c = corpsReservation(d, { listingId: L, roomTypeId: R }, detail, 'nommos', 'https://nommos.sites.sojori.com')
  it('prix = celui relu par le serveur ; carte ; marque blanche du site ; retour sur le site', () => {
    assert.deepEqual(c.pricing, detail)
    assert.equal(c.payment.method, 'card')
    assert.equal(c.payment.returnBaseUrl, 'https://nommos.sites.sojori.com')
    assert.deepEqual(c.marqueBlanche, { siteSlug: 'nommos' })
    assert.equal(c.listingId, L)
    assert.equal(c.roomTypeId, R)
    assert.equal(c.bookingChannel, 'directBooking')
  })
  it('type simple (sans unité) : pas de roomTypeId', () => {
    assert.equal('roomTypeId' in corpsReservation(d, { listingId: L }, detail, 'nommos', 'https://x.sojori.com'), false)
  })
})

describe('création : tout refus est net, jamais une réservation devinée', () => {
  const d = lireDemande(JSON.stringify(bon))!
  const c = corpsReservation(d, { listingId: L, roomTypeId: R }, detail, 'nommos', 'https://nommos.sites.sojori.com')
  const rep = (statut: number, corps: unknown) => (async () => new Response(JSON.stringify(corps), { status: statut })) as typeof fetch
  it('succès : lien CMI en https', async () => {
    const r = await creer(c, 'https://api.test', rep(200, { success: true, data: { paymentUrl: 'https://app.sojori.com/pay/ABC', reservationNumber: 'SJ1' } }))
    assert.deepEqual(r, { ok: true, paymentUrl: 'https://app.sojori.com/pay/ABC', reservationNumber: 'SJ1' })
  })
  it('lien non https, absent, schéma imprévu : refus', async () => {
    for (const u of ['http://app.sojori.com/p', 'javascript:alert(1)', 'https://evil.test/p', 'https://sojori.com.evil.test/p', 'https://user:pw@app.sojori.com/p', '', null, undefined])
      assert.equal((await creer(c, 'https://api.test', rep(200, { success: true, data: { paymentUrl: u, reservationNumber: 'SJ1' } }))).ok, false, String(u))
    assert.equal(lienOuvrable('ftp://x'), false)
  })
  it('hôtes de paiement : nos pages (sojori.com et sous-domaines) et la banque (cmi.co.ma), jamais un autre', () => {
    for (const ok of ['https://sojori.com/p', 'https://app.sojori.com/p', 'https://dev.sojori.com/pay/1', 'https://damanecash.cmi.co.ma/fim/est3Dgate', 'https://test-damanecash.cmi.co.ma/x'])
      assert.equal(hotePaiementOk(ok), true, ok)
    for (const ko of ['https://evilsojori.com/p', 'https://sojori.com.evil.test/', 'https://cmi.co.ma.evil.test/', 'https://x.test/', 'http://app.sojori.com/', 'https://localhost/', 'https://127.0.0.1/'])
      assert.equal(hotePaiementOk(ko), false, ko)
  })
  it('moteur fermé (403) et paiement déjà en attente (409) : codes dits ; erreur serveur : générique', async () => {
    assert.deepEqual(await creer(c, 'https://api.test', rep(403, { success: false, code: 'MOTEUR_FERME' })), { ok: false, statut: 403, code: 'MOTEUR_FERME' })
    assert.deepEqual(await creer(c, 'https://api.test', rep(409, { success: false, code: 'UNPAID_RESERVATION_EXISTS' })), { ok: false, statut: 409, code: 'UNPAID_RESERVATION_EXISTS' })
    // prix changé / dates prises : messages distincts (codes de srv-reservations ramenés)
    for (const [brut, dit] of [['PRICE_CHANGED', 'PRIX_CHANGE'], ['NIGHTS_WITHOUT_PRICE', 'PRIX_CHANGE'], ['DATES_NOT_AVAILABLE', 'INDISPONIBLE'], ['LISTING_UNAVAILABLE', 'INDISPONIBLE'], ['RESERVATION_ALREADY_EXISTS', 'INDISPONIBLE'], ['PRICING_UNAVAILABLE', 'PRICING_UNAVAILABLE']] as const)
      assert.equal(codeDit(brut), dit, brut)
    assert.deepEqual(await creer(c, 'https://api.test', rep(409, { success: false, code: 'PRICE_CHANGED' })), { ok: false, statut: 409, code: 'PRIX_CHANGE' })
    assert.equal(codeDit('quelque chose d’inconnu'), 'autre')
    assert.equal(codeDit(undefined), 'autre')
    const r = await creer(c, 'https://api.test', rep(500, { success: false, error: 'Mongo://secret' }))
    assert.deepEqual(r, { ok: false, statut: 502, code: 'autre' })
    assert.equal(JSON.stringify(r).includes('Mongo'), false)
  })
  it('réseau coupé : refus générique', async () => {
    const r = await creer(c, 'https://api.test', (async () => {
      throw new Error('ECONNREFUSED')
    }) as typeof fetch)
    assert.deepEqual(r, { ok: false, statut: 502, code: 'autre' })
  })
  it('appelle POST /api/v1/guest/reservations (une seule fois, sans barre en trop)', async () => {
    const vus: string[] = []
    await creer(c, 'https://api.test/', (async (u: RequestInfo | URL, init?: RequestInit) => {
      vus.push(`${init?.method} ${String(u)}`)
      return new Response('{}', { status: 500 })
    }) as typeof fetch)
    assert.deepEqual(vus, ['POST https://api.test/api/v1/guest/reservations'])
  })
})

describe('choisirMode : le mode du moteur d’un site', () => {
  it('brouillon = demo (même si le slug est ouvert) ; publié ouvert = ligne ; publié fermé = ferme (WhatsApp)', () => {
    const env = { SITE_RESERVATION_LIGNE_SLUGS: 'nommos' }
    assert.equal(choisirMode(true, 'nommos', env), 'demo')
    assert.equal(choisirMode(false, 'nommos', env), 'ligne')
    assert.equal(choisirMode(false, 'autre-site', env), 'ferme')
    assert.equal(choisirMode(false, 'nommos', {}), 'ferme')
    assert.equal(choisirMode(false, '', env), 'ferme')
  })
})

describe('route : toute la décision (traiter), lectures et création injectées', () => {
  const sejourOk = { arrivee: '2026-12-23', depart: '2026-12-25', voyageurs: 2, nuits: 2 }
  const libre = { etat: 'libre', devis: { detail } }
  const base = (over: Partial<Deps> = {}): { deps: Deps; appels: string[] } => {
    const appels: string[] = []
    const deps: Deps = {
      env: { SITE_RESERVATION_LIGNE_SLUGS: 'nommos' },
      limite: () => false,
      sejour: () => sejourOk,
      ids: (id) => {
        const [listingId, roomTypeId] = id.split(':')
        return { listingId, ...(roomTypeId ? { roomTypeId } : {}) }
      },
      type: async () => libre,
      creer: async (corps) => {
        appels.push(JSON.stringify(corps))
        return { ok: true, paymentUrl: 'https://app.sojori.com/pay/X', reservationNumber: 'SJ9' }
      },
      ...over,
    }
    return { deps, appels }
  }
  const entree = (brut: string = JSON.stringify(bon), slug = 'nommos') => ({ slug, brut, ip: '1.2.3.4', hote: 'nommos.sites.sojori.com' })

  it('succès : la réservation est créée avec le prix relu et le lien de paiement est rendu', async () => {
    const { deps, appels } = base()
    const r = await traiter(entree(), deps)
    assert.equal(r.statut, 200)
    assert.deepEqual(r.corps, { success: true, paymentUrl: 'https://app.sojori.com/pay/X', reservationNumber: 'SJ9' })
    assert.equal(appels.length, 1)
    const corps = JSON.parse(appels[0])
    assert.deepEqual(corps.pricing, detail)
    assert.equal(corps.payment.returnBaseUrl, 'https://nommos.sites.sojori.com')
  })
  it('site non ouvert : 404 et AUCUN appel (le comportement d’avant est inchangé)', async () => {
    const { deps, appels } = base({ env: {} })
    assert.equal((await traiter(entree(), deps)).statut, 404)
    assert.equal((await traiter(entree(JSON.stringify(bon), 'autre-site'), base().deps)).statut, 404)
    assert.equal(appels.length, 0)
  })
  it('limite de débit : 429 sans lecture ni création', async () => {
    const { deps, appels } = base({ limite: () => true })
    assert.equal((await traiter(entree(), deps)).statut, 429)
    assert.equal(appels.length, 0)
  })
  it('type pas libre (indisponible, capacité, durée, prix, erreur), inconnu, ou sans détail de prix : 409 INDISPONIBLE, rien n’est créé', async () => {
    // Même avec un détail de prix présent, un type qui n'est pas « libre » n'est jamais réservé.
    for (const t of [{ etat: 'indisponible', devis: { detail } }, { etat: 'capacite', devis: { detail } }, { etat: 'duree', devis: { detail } }, { etat: 'prix', devis: { detail } }, { etat: 'erreur', devis: { detail } }, { devis: { detail } }, { etat: 'libre', devis: {} }, { etat: 'libre' }, null]) {
      const { deps, appels } = base({ type: async () => t })
      const r = await traiter(entree(), deps)
      assert.deepEqual([r.statut, r.corps.code], [409, 'INDISPONIBLE'], JSON.stringify(t))
      assert.equal(appels.length, 0)
    }
  })
  it('demande hostile, séjour invalide, identifiant invalide, hôte invalide : 400 sans appel', async () => {
    const { deps, appels } = base()
    assert.equal((await traiter(entree('pas du json'), deps)).statut, 400)
    assert.equal((await traiter(entree(), base({ sejour: () => null }).deps)).statut, 400)
    assert.equal((await traiter(entree(), base({ ids: () => null }).deps)).statut, 400)
    assert.equal((await traiter({ ...entree(), hote: 'x/../évil' }, deps)).statut, 400)
    assert.equal((await traiter(entree('x'.repeat(5000)), deps)).statut, 413)
    assert.equal(appels.length, 0)
  })
  it('refus de srv-reservations : code dit, statut cohérent, jamais de détail technique', async () => {
    const { deps } = base({ creer: async () => ({ ok: false, statut: 403, code: 'MOTEUR_FERME' }) })
    assert.deepEqual(await traiter(entree(), deps), { statut: 403, corps: { success: false, code: 'MOTEUR_FERME' } })
  })
})
