import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to:
 * 1. Prevent redirects to old site
 * 2. Force HTTPS
 * 3. Add cache-busting headers
 * 4. Ensure users stay on new Vercel deployment
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Force HTTPS
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`, 301);
  }

  // Add cache-busting headers
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Add version header to bust cloudflare/CDN cache
  response.headers.set('X-App-Version', new Date().getTime().toString());

  // Block any requests that look like they're trying to redirect to old site
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';

  // If referrer is from old domain, force new site
  if (referer.includes('old-domain.com') || referer.includes('localhost:3000')) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  // Prevent service worker from caching old content
  if (request.nextUrl.pathname === '/service-worker.js') {
    const swResponse = new NextResponse(
      `
        // Service worker disabled during migration
        self.skipWaiting();
        self.addEventListener('install', (event) => {
          event.waitUntil(self.skipWaiting());
        });
        self.addEventListener('activate', (event) => {
          event.waitUntil(
            caches.keys().then((names) => Promise.all(names.map(name => caches.delete(name))))
          );
        });
      `,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/javascript',
        },
      }
    );
    return swResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
