import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const storesData = stores.map((store) => ({
      id: store.id,
      name: store.name,
      totalCells: store.cells.length,
      occupiedCells: store.cells.filter((c) => c.packages.length > 0).length,
    }))

    const inTransitCount = await prisma.package.count({
      where: { status: 'IN_TRANSIT' },
    })

    const recentLogs = await prisma.packageLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        package: {
          include: {
            receiver: true,
            sender: true,
          },
        },
      },
    })

    return NextResponse.json({
      stores: storesData,
      inTransit: inTransitCount,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        packageId: log.packageId,
        action: log.action,
        note: log.note,
        staffNote: log.staffNote,
        createdAt: log.createdAt,
        package: log.package,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
