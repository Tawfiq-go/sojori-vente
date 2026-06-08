import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
