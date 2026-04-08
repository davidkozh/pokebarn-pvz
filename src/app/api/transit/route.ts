import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.package.findMany({
      where: { status: 'IN_TRANSIT' },
      include: {
        receiver: true,
        sender: true,
        cell: true,
        store: true,
      },
    })

    const result = packages.map((pkg) => ({
      id: pkg.id,
      cellNumber: pkg.cell?.number || null,
      storeName: pkg.store.name,
      senderName: pkg.sender.name,
      receiverName: pkg.receiver.name,
      description: pkg.description,
      createdAt: pkg.createdAt.toISOString(),
    }))

    return NextResponse.json({ packages: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
