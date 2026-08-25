import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { status } = await request.json()
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
      },
    })
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 })
  }
}
