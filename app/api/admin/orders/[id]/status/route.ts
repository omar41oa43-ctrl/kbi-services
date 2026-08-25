import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateAdmin } from '@/lib/api-auth'

const allowedStatuses = new Set([
  'PENDING', 'CREATED', 'SEARCHING', 'REVIEWING', 'QUOTED', 'APPROVED',
  'ASSIGNED', 'ON_THE_WAY', 'EN_ROUTE', 'ARRIVED', 'INSPECTION',
  'QUOTE_APPROVAL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await authenticateAdmin(request)
  if (!identity) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const { status } = await request.json()
    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }
    const order = await prisma.order.update({
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
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 })
  }
}
