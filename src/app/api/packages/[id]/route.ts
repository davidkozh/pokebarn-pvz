import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/auth'

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
        logs: true,
      },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pkg)
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

    const pkg = await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    })

    // Create log entry
    await prisma.packageLog.create({
      data: {
        packageId: pkg.id,
        action: logAction,
        note: logNote,
      },
    })

    // Return updated package with relations
    const updatedPkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        receiver: true,
        sender: true,
        pickedUpBy: true,
        cell: true,
        store: true,
        logs: true,
      },
    })

    return NextResponse.json(updatedPkg)
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
