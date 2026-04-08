import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')

    let where: any = {}

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    const cells = await prisma.cell.findMany({
      where,
      include: {
        store: true,
        packages: {
          where: { status: 'STORED' },
          include: { receiver: true },
        },
      },
    })

    let filtered = cells

    if (status === 'free') {
      filtered = filtered.filter((c: any) => c.packages.length === 0)
    } else if (status === 'occupied') {
      filtered = filtered.filter((c: any) => c.packages.length > 0)
    }

    const result = filtered.map((cell: any) => ({
      id: cell.id,
      cellNumber: cell.number,
      number: cell.number,
      storeId: cell.storeId,
      storeName: cell.store.name,
      status: cell.packages.length > 0 ? 'OCCUPIED' : 'FREE',
      clientName: cell.packages.length > 0 ? cell.packages[0].receiver.name : null,
      packageCount: cell.packages.length,
    }))

    return NextResponse.json({ cells: result })
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
    const { storeId, count } = body

    if (!storeId || !count) {
      return NextResponse.json(
        { error: 'storeId and count are required' },
        { status: 400 }
      )
    }

    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    const maxCell = await prisma.cell.findFirst({
      where: { storeId: parseInt(storeId) },
      orderBy: { number: 'desc' },
    })

    const startNumber = (maxCell?.number || 0) + 1
    const newCells = []

    for (let i = 0; i < count; i++) {
      const cell = await prisma.cell.create({
        data: {
          number: startNumber + i,
          storeId: parseInt(storeId),
        },
      })
      newCells.push({
        id: cell.id,
        cellNumber: cell.number,
        number: cell.number,
        storeId: cell.storeId,
        storeName: store.name,
        status: 'FREE',
        clientName: null,
        packageCount: 0,
      })
    }

    return NextResponse.json({ cells: newCells }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
