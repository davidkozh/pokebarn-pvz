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
