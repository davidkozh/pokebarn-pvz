import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone'
import { verifyAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.toLowerCase() || ''

    const clients = await prisma.client.findMany()

    if (q) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(q) || client.phone.includes(q)
      )
      return NextResponse.json(filtered)
    }

    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      )
    }

    // Check phone uniqueness
    const existing = await prisma.client.findUnique({
      where: { phone: normalizedPhone },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone: normalizedPhone,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
