import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone'
import { verifyAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const storeId = searchParams.get('storeId')
    const receiverPhone = searchParams.get('receiverPhone')

    let where: any = {}

    if (status) {
      where.status = status
    }

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (receiverPhone) {
      const normalized = normalizePhone(receiverPhone)
      if (normalized) {
        where.receiver = { phone: normalized }
      }
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        receiver: true,
        sender: true,
        cell: true,
        store: true,
        logs: true,
      },
    })

    return NextResponse.json(packages)
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
    const { receiverId, senderId, description, storeId, cellId } = body

    if (!receiverId || !senderId || !description || !storeId) {
      return NextResponse.json(
        { error: 'receiverId, senderId, description, and storeId are required' },
        { status: 400 }
      )
    }

    // Verify clients exist
    const receiver = await prisma.client.findUnique({
      where: { id: parseInt(receiverId) },
    })
    const sender = await prisma.client.findUnique({
      where: { id: parseInt(senderId) },
    })

    if (!receiver || !sender) {
      return NextResponse.json(
        { error: 'Receiver or sender not found' },
        { status: 404 }
      )
    }

    // Check if receiver has active package in this store
    let assignCellId = cellId ? parseInt(cellId) : null

    const activePackage = await prisma.package.findFirst({
      where: {
        receiverId: parseInt(receiverId),
        storeId: parseInt(storeId),
        status: 'STORED',
      },
    })

    if (activePackage && activePackage.cellId) {
      assignCellId = activePackage.cellId
    } else if (!assignCellId) {
      // Find first free cell
      const freeCell = await prisma.cell.findFirst({
        where: {
          storeId: parseInt(storeId),
          packages: { none: { status: 'STORED' } },
        },
      })

      if (!freeCell) {
        return NextResponse.json(
          { error: 'No free cells available in store' },
          { status: 400 }
        )
      }

      assignCellId = freeCell.id
    }

    const pkg = await prisma.package.create({
      data: {
        description,
        receiverId: parseInt(receiverId),
        senderId: parseInt(senderId),
        storeId: parseInt(storeId),
        cellId: assignCellId,
        status: 'STORED',
        logs: {
          create: {
            action: 'RECEIVED',
          },
        },
      },
      include: {
        receiver: true,
        sender: true,
        cell: true,
        store: true,
        logs: true,
      },
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
