import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export interface SessionUser {
  id: string
  email: string
  role: string
  loginName?: string
  [key: string]: any
}

export interface Session {
  user: SessionUser | null
  token: string | null
  isValid: boolean
}

export async function getServerSession(): Promise<Session> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value || null
  const authUserCookie = cookieStore.get('auth_user')?.value

  if (!token || !authUserCookie) {
    return { user: null, token: null, isValid: false }
  }

  try {
    const user = JSON.parse(authUserCookie) as SessionUser
    return { user, token, isValid: true }
  } catch (error) {
    return { user: null, token: null, isValid: false }
  }
}

export function getSessionFromRequest(req: NextRequest): Session {
  const token = req.cookies.get('token')?.value || null
  const authUserCookie = req.cookies.get('auth_user')?.value

  if (!token || !authUserCookie) {
    return { user: null, token: null, isValid: false }
  }

  try {
    const user = JSON.parse(authUserCookie) as SessionUser
    return { user, token, isValid: true }
  } catch (error) {
    return { user: null, token: null, isValid: false }
  }
}

export function getDashboardPath(role: string | undefined): string {
  if (!role) return '/dashboard'
  const normalizedRole = role.toUpperCase().replace(/[-\s]+/g, '_')
  switch (normalizedRole) {
    case 'SUPER_ADMIN': return '/super-admin'
    case 'ADMIN': return '/admin'
    case 'AGENT': return '/agent-dashboard'
    case 'CLIENT': return '/dashboard'
    case 'SETTLEMENT_ADMIN': return '/adminpanel/settlement-admin'
    default: return '/dashboard'
  }
}
