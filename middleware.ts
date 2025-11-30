import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest, getDashboardPath } from './lib/auth/session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/signup', '/']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  const protectedRoutes = ['/dashboard', '/super-admin', '/admin', '/agent-dashboard', '/client', '/adminpanel']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  const session = getSessionFromRequest(request)

  // Redirect authenticated users away from login/signup
  if ((pathname === '/login' || pathname === '/signup') && session.isValid && session.user) {
    const role = session.user.role?.toUpperCase().replace(/[-\s]+/g, '_')
    // For SUPER_ADMIN, redirect to selection page
    if (role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin/select', request.url))
    }
    const dashboardPath = getDashboardPath(session.user.role)
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !session.isValid) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect from /dashboard to role-specific dashboard
  if (pathname === '/dashboard' && session.isValid && session.user) {
    const dashboardPath = getDashboardPath(session.user.role)
    if (dashboardPath !== '/dashboard') {
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

