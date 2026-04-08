import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone'
import { verifyAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = parseInt(id)

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        sentPackages: {
          include: { receiver: true, store: true, cell: true, logs: true },
        },
        receivedPackages: {
          include: { sender: true, store: true, cell: true, logs: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const clientId = parseInt(id)

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, phone } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) {
      const normalizedPhone = normalizePhone(phone)
      if (!normalizedPhone) {
        return NextResponse.json(
          { error: 'Invalid phone format' },
          { status: 400 }
        )
      }

      // Check uniqueness against other clients
      const existing = await prisma.client.findUnique({
        where: { phone: normalizedPhone },
      })
      if (existing && existing.id !== clientId) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }

      updateData.phone = normalizedPhone
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    })

    return NextResponse.json(client)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
