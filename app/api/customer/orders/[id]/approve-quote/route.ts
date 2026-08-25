import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const updatedOrder = await prisma.order.update({
      where: { id, customerId: user.id, status: 'QUOTED' },
      data: { status: 'APPROVED' },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'APPROVED',
        changedBy: identity.uid,
      },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Error approving quote:', error)
    return NextResponse.json({ success: false, error: 'Failed to approve quote' }, { status: 500 })
  }
}
