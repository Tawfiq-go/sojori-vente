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
  const res = NextResponse.next();
  if (tenant) {
    res.cookies.set(TENANT_COOKIE, tenant, { path: '/', sameSite: 'lax' });
  } else if (req.cookies.has(TENANT_COOKIE)) {
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
