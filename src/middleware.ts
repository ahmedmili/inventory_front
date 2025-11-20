import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated via cookie
  // We set isAuthenticated cookie on login for middleware to check
  // Detailed permission checks are handled by RouteGuard components
  const hasAuthCookie = request.cookies.has('isAuthenticated') ||
                        request.cookies.has('refreshToken');

  // If no auth cookie and trying to access protected route, redirect to login
  // Note: Detailed permission checks are handled by RouteGuard components
  // because middleware doesn't have access to localStorage or full user object
  if (!hasAuthCookie && !PUBLIC_ROUTES.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};

