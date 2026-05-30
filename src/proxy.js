import { NextResponse } from 'next/server';

export function proxy(request) {
  const sessionCookie = request.cookies.get('savan-session');
  const hasSession = !!sessionCookie?.value;
  const { pathname } = request.nextUrl;

  // Define protected paths
  const protectedPaths = [
    '/dashboard',
    '/tasks',
    '/expenses',
    '/budget',
    '/monthly',
    '/ai-review',
    '/history',
    '/settings'
  ];

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));


  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }



  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - next static/image files
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
};
