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

    const occupiedCellsByStore = stores.map((store: any) => ({
      storeName: store.name,
      occupied: store.cells.filter((c: any) => c.packages.length > 0).length,
      total: store.cells.length,
    }))

    const packagesInTransit = await prisma.package.count({
      where: { status: 'IN_TRANSIT' },
    })

    const logs = await prisma.packageLog.findMany({
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
      occupiedCellsByStore,
      packagesInTransit,
      recentLogs: logs.map((log: any) => ({
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        packageId: String(log.packageId),
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
