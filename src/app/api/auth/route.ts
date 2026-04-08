import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || ''
    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    const token = hashPassword(expectedPassword)
    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authenticated = await verifyAdmin(request)
    if (!authenticated) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.delete(ADMIN_COOKIE_NAME)
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
