import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { estHoteDeLaPlateforme, estHoteEssai } from '../../lib/tenantDomains.ts'

describe('zone d’essai des sites de clients', () => {
  it('reconnaît <nom>.sites.sojori.com, un seul niveau, avec ou sans port', () => {
    for (const h of ['nommos.sites.sojori.com', 'Nommos.Sites.Sojori.com', 'nommos-beach.sites.sojori.com', 'x1.sites.sojori.com:443'])
      assert.equal(estHoteEssai(h), true, h)
    for (const h of ['sites.sojori.com', 'a.b.sites.sojori.com', '-x.sites.sojori.com', 'x-.sites.sojori.com', 'nommos.sojori.com', 'evil.com', 'nommos.sites.sojori.com.evil.com', '', null, undefined])
      assert.equal(estHoteEssai(h as string), false, String(h))
  })

  it('un hôte de la zone désigne le site d’un client, tout autre *.sojori.com reste la plateforme', () => {
    assert.equal(estHoteDeLaPlateforme('nommos.sites.sojori.com'), false)
    for (const h of ['sojori.com', 'book.sojori.com', 'admin.sojori.com', 'sites.sojori.com', 'a.b.sites.sojori.com', 'localhost', 'x.vercel.app'])
      assert.equal(estHoteDeLaPlateforme(h), true, h)
  })
})
