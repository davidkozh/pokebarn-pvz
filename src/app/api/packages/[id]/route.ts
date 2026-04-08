import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

function formatPackage(pkg: any) {
  return {
    id: pkg.id,
    status: pkg.status,
    description: pkg.description,
    cellNumber: pkg.cell?.number || null,
    storeName: pkg.store.name,
    senderName: pkg.sender.name,
    receiverName: pkg.receiver.name,
    receiverPhone: pkg.receiver.phone,
    createdAt: pkg.createdAt.toISOString(),
    pickedUpAt: pkg.status === 'ISSUED' ? pkg.updatedAt.toISOString() : null,
    pickedUpBy: pkg.pickedUpBy?.name || null,
    eventLog: (pkg.logs || []).map((log: any) => ({
      action: log.action,
      note: log.note,
      staffNote: log.staffNote,
      timestamp: log.createdAt.toISOString(),
    })),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const packageId = parseInt(id)

    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      )
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        receiver: true,
        sender: true,
        pickedUpBy: true,
        cell: true,
        store: true,
        logs: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ package: formatPackage(pkg) })
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
    const packageId = parseInt(id)

    if (isNaN(packageId)) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, pickedUpById, targetStoreId, cellId } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let logAction: string = ''
    let logNote: string | null = null

    if (action === 'ISSUE') {
      updateData = {
        status: 'ISSUED',
        cellId: null,
        pickedUpById: pickedUpById ? parseInt(pickedUpById) : null,
      }
      logAction = 'ISSUED'
    } else if (action === 'TRANSIT') {
      if (!targetStoreId) {
        return NextResponse.json(
          { error: 'targetStoreId is required for TRANSIT action' },
          { status: 400 }
        )
      }
      updateData = {
        status: 'IN_TRANSIT',
        cellId: null,
        storeId: parseInt(targetStoreId),
      }
      logAction = 'TRANSIT_STARTED'
      logNote = `Moving to store ${targetStoreId}`
    } else if (action === 'RECEIVE_TRANSIT') {
      if (!cellId) {
        return NextResponse.json(
          { error: 'cellId is required for RECEIVE_TRANSIT action' },
          { status: 400 }
        )
      }
      updateData = {
        status: 'STORED',
        cellId: parseInt(cellId),
      }
      logAction = 'TRANSIT_COMPLETED'
    } else if (action === 'CHANGE_CELL') {
      if (!cellId) {
        return NextResponse.json(
          { error: 'cellId is required for CHANGE_CELL action' },
          { status: 400 }
        )
      }
      updateData = {
        cellId: parseInt(cellId),
      }
      logAction = 'CELL_CHANGED'
      logNote = `Changed to cell ${cellId}`
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    updateData.updatedAt = new Date()

    await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    })

    await prisma.packageLog.create({
      data: {
        packageId,
        action: logAction,
        note: logNote,
      },
    })

    const updatedPkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        receiver: true,
        sender: true,
        pickedUpBy: true,
        cell: true,
        store: true,
        logs: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ package: formatPackage(updatedPkg) })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
