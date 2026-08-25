import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const order = await prisma.order.findUnique({
      where: { id },
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
