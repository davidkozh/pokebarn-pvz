import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.toLowerCase() || ''

    if (!q || q.length === 0) {
      return NextResponse.json([])
    }

    const clients = await prisma.client.findMany({
      take: 10,
    })

    const filtered = clients.filter(
      (client: any) =>
        client.name.toLowerCase().includes(q) || client.phone.includes(q)
    )

    return NextResponse.json(filtered.slice(0, 10))
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
