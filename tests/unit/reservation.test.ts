import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { corpsReservation, creer, lienOuvrable, lireDemande, reservationEnLigne, sitesEnLigne } from '../../lib/site/reservation.ts'

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
    const r = await creer(c, 'https://api.test', rep(200, { success: true, data: { paymentUrl: 'https://paiement.test/pay/ABC', reservationNumber: 'SJ1' } }))
    assert.deepEqual(r, { ok: true, paymentUrl: 'https://paiement.test/pay/ABC', reservationNumber: 'SJ1' })
  })
  it('lien non https, absent, schéma imprévu : refus', async () => {
    for (const u of ['http://x.test/p', 'javascript:alert(1)', '', null, undefined])
      assert.equal((await creer(c, 'https://api.test', rep(200, { success: true, data: { paymentUrl: u, reservationNumber: 'SJ1' } }))).ok, false, String(u))
    assert.equal(lienOuvrable('ftp://x'), false)
  })
  it('moteur fermé (403) et paiement déjà en attente (409) : codes dits ; erreur serveur : générique', async () => {
    assert.deepEqual(await creer(c, 'https://api.test', rep(403, { success: false, code: 'MOTEUR_FERME' })), { ok: false, statut: 403, code: 'MOTEUR_FERME' })
    assert.deepEqual(await creer(c, 'https://api.test', rep(409, { success: false, code: 'UNPAID_RESERVATION_EXISTS' })), { ok: false, statut: 409, code: 'UNPAID_RESERVATION_EXISTS' })
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
