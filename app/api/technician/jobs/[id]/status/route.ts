import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

const transitions: Record<string, readonly string[]> = {
  ASSIGNED: ['ON_THE_WAY', 'EN_ROUTE', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['INSPECTION', 'IN_PROGRESS'],
  INSPECTION: ['QUOTE_APPROVAL', 'IN_PROGRESS'],
  QUOTE_APPROVAL: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { status } = await request.json()
    const identity = await authenticateTechnician(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const technician = await findPrismaTechnician(identity)
    if (!technician) return NextResponse.json({ success: false, error: 'Technician profile not found' }, { status: 404 })

    const current = await prisma.order.findFirst({ where: { id, technicianId: technician.id } })
    if (!current) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    if (!transitions[current.status]?.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid transition from ${current.status} to ${status}` }, { status: 409 })
    }

    const job = await prisma.order.update({
      where: { id },
      data: { status: status as never },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status as never,
        changedBy: identity.uid,
      },
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error updating job status:', error)
    return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
  }
}
