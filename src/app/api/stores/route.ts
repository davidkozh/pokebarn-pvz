import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const stores = await prisma.store.findMany({
      include: {
        cells: {
          include: {
            packages: { where: { status: 'STORED' } },
          },
        },
      },
    })

    const result = stores.map((store) => ({
      id: store.id,
      name: store.name,
      totalCells: store.cells.length,
      occupiedCells: store.cells.filter((c) => c.packages.length > 0).length,
    }))

    return NextResponse.json({ stores: result })
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
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      )
    }

    const store = await prisma.store.create({
      data: { name },
      include: { cells: true },
    })

    return NextResponse.json(
      {
        id: store.id,
        name: store.name,
        totalCells: store.cells.length,
        occupiedCells: 0,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
