import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { TENANT_COOKIE, resolveTenantFromHost } from '@/lib/tenantDomains';

/** Seules ces routes exigent une session — tout le reste (homepage, listings…) reste public. */
const isProtectedRoute = createRouteMatcher(['/profile(.*)']);
const isComingSoonBypass = createRouteMatcher(['/coming-soon(.*)']);

/** Production Vercel : COMING_SOON=true bloque tout le site sauf /coming-soon */
const COMING_SOON = process.env.COMING_SOON === 'true';

export default clerkMiddleware(async (auth, req) => {
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
    const res = NextResponse.next();
    res.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
    return res;
  }
  const res = NextResponse.next();
  if (req.cookies.has(TENANT_COOKIE)) {
    res.cookies.delete(TENANT_COOKIE);
  }
  return res;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
