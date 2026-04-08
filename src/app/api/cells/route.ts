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
        packages: {
          include: { receiver: true, sender: true, store: true, logs: true },
        },
      },
    })

    // Filter by status based on STORED packages only
    let filtered = cells.map((cell) => ({
      ...cell,
      storedPackages: cell.packages.filter((p) => p.status === 'STORED'),
    }))

    if (status === 'free') {
      filtered = filtered.filter((c) => c.storedPackages.length === 0)
    } else if (status === 'occupied') {
      filtered = filtered.filter((c) => c.storedPackages.length > 0)
    }

    const result = filtered.map((cell) => ({
      id: cell.id,
      number: cell.number,
      storeId: cell.storeId,
      packages: cell.packages,
      isOccupied: cell.storedPackages.length > 0,
    }))

    return NextResponse.json(result)
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

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Find max number in store
    const maxCell = await prisma.cell.findFirst({
      where: { storeId: parseInt(storeId) },
      orderBy: { number: 'desc' },
    })

    const startNumber = (maxCell?.number || 0) + 1
    const cells = []

    for (let i = 0; i < count; i++) {
      const cell = await prisma.cell.create({
        data: {
          number: startNumber + i,
          storeId: parseInt(storeId),
        },
      })
      cells.push(cell)
    }

    return NextResponse.json(cells, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
