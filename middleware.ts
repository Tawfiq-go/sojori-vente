import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { estUnCheminDuSite } from '@/lib/site/route';
import { pagesDuSite } from '@/lib/site/routage';
import { TENANT_COOKIE, estHoteEssai, lastResolveDebug, resolveTenantFromHost } from '@/lib/tenantDomains';

/** Seules ces routes exigent une session — tout le reste (homepage, listings…) reste public. */
const isProtectedRoute = createRouteMatcher(['/profile(.*)']);
const isComingSoonBypass = createRouteMatcher(['/coming-soon(.*)']);

/** Production Vercel : COMING_SOON=true bloque tout le site sauf /coming-soon */
const COMING_SOON = process.env.COMING_SOON === 'true';

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // `x-site-pm` n'est JAMAIS repris d'un client : seul ce middleware le pose (sinon un visiteur pourrait faire rendre
  // le marché sans sa coque). Les requêtes passent toutes par `propre` ; les pages d'un site ajoutent l'en-tête.
  const propre = new Headers(req.headers);
  propre.delete('x-site-pm');
  const suite = () => NextResponse.next({ request: { headers: propre } });
  // Pages du site d'un PM (aperçu) : le layout racine n'y pose ni Clerk, ni JSON-LD « Sojori », ni police de la plateforme.
  const enteteSite = new Headers(propre);
  enteteSite.set('x-site-pm', '1');
  if (path.startsWith('/site-apercu/')) {
    return NextResponse.next({ request: { headers: enteteSite } });
  }

  // Proxy API dev local : pas de résolution tenant / Clerk inutile
  if (path.startsWith('/api/sojori')) {
    return suite();
  }

  // Le site d'un PM ne s'ouvre que sur SON domaine (réécriture plus bas), jamais en direct.
  if (path === '/site-pm' || path.startsWith('/site-pm/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (COMING_SOON && !isComingSoonBypass(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/coming-soon';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Marque blanche : un domaine client (ex. siyahai.com) impose son tenant
  // via le cookie `pm_tenant` — sojori.com n'en pose jamais et reste la
  // marketplace. Le cookie étant par domaine, aucune fuite entre les deux.
  const tenant = await resolveTenantFromHost(req.headers.get('host'));
  // Zone d'essai (`<nom>.sites.sojori.com`) : jamais référencée, quelle que soit la page.
  const noindex = <T extends NextResponse>(r: T): T => {
    if (estHoteEssai(req.headers.get('host'))) r.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return r;
  };
  if (tenant) {
    // Routes 100 % marketplace Sojori (annuaire des PMs, recrutement, expériences)
    // interdites sur un site client — retour à son accueil. Sa propre vitrine
    // /pm/<slug> reste accessible.
    const path = req.nextUrl.pathname;
    const marketplaceOnly = /^\/verified-hosts(\/|$)/.test(path);
    const foreignVitrine =
      /^\/pm(\/|$)/.test(path) && !(path === `/pm/${tenant}` || path.startsWith(`/pm/${tenant}/`));
    if (marketplaceOnly || foreignVitrine) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
      return redirect;
    }
    // Site composé par l'agent Site web : ses pages viennent de sa fiche publiée (srv-site) ;
    // logements, réservation et compte restent les pages de sojori-vente.
    const site = await pagesDuSite(tenant);
    // Zone d'essai : tant que le site du client n'est pas publié, l'adresse ne montre RIEN (jamais la marketplace Sojori, dont
    // la page d'accueil porterait la marque Sojori sous l'adresse d'un client). Constaté le 22/11/2026 sur nommos.sites.sojori.com.
    if (!site && estHoteEssai(req.headers.get('host'))) {
      return noindex(new NextResponse('Not found', { status: 404 }));
    }
    // Isolation : sur le domaine d'un client qui a son site, ni la recherche ni les fiches du marché Sojori ne
    // s'ouvrent (logements d'autres PM, design Sojori) — la réservation et la fiche d'une villa sont des pages du site.
    if (site) {
      const vers = (chemin: string) => {
        const url = req.nextUrl.clone();
        url.pathname = chemin;
        url.search = '';
        const redirect = NextResponse.redirect(url);
        redirect.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
        return redirect;
      };
      if (path === '/search') return vers('/reserver');
      const villa = path.match(/^\/listings\/([A-Za-z0-9:_-]+)\/?$/);
      if (villa) return vers(`/reserver/${villa[1]}`);
    }
    if (site && estUnCheminDuSite(path, site.pages, site.langues)) {
      const url = req.nextUrl.clone();
      url.pathname = `/site-pm/${tenant}${path === '/' ? '' : path}`;
      const rw = NextResponse.rewrite(url, { request: { headers: enteteSite } });
      rw.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
      rw.headers.set('x-pm-resolve', lastResolveDebug || 'static');
      rw.headers.set('x-pm-site', 'fiche');
      return noindex(rw);
    }
    const res = suite();
    res.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
    res.headers.set('x-pm-resolve', lastResolveDebug || 'static');
    return noindex(res);
  }
  const res = suite();
  res.headers.set('x-pm-resolve', lastResolveDebug || 'none');
  if (req.cookies.has(TENANT_COOKIE)) {
    res.cookies.delete(TENANT_COOKIE);
  }
  // Une adresse de la zone d'essai sans client rattaché ne montre jamais la marketplace comme si c'était son site.
  if (estHoteEssai(req.headers.get('host'))) {
    return noindex(new NextResponse('Not found', { status: 404 }));
  }
  return res;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
