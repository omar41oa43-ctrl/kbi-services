import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateAdmin } from '@/lib/api-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authenticateAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        devices: true,
        statusHistory: true,
        quotes: true,
        technician: true,
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
