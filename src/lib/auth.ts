import { cookies } from 'next/headers'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

export const ADMIN_COOKIE_NAME = 'admin_token'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function createAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD || ''
  return hashPassword(password)
}

export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

    if (!token) return false

    const expectedToken = createAdminToken()
    return token === expectedToken
  } catch {
    return false
  }
}
