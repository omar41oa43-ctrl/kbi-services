import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const order = await prisma.order.findUnique({
      where: { id, customerId: user.id },
      include: {
        customer: true,
        devices: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        quotes: true,
        technician: { include: { user: true } },
        repairPhotos: true,
        payments: true,
        invoice: true,
        review: true,
        warranty: true,
      },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 })
  }
}
