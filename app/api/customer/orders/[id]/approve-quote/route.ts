import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const mockUserId = 'cust-1'

    const updatedOrder = await prisma.order.update({
      where: { id, customerId: mockUserId },
      data: { status: 'APPROVED' },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'APPROVED',
        changedBy: mockUserId,
      },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('Error approving quote:', error)
    return NextResponse.json({ success: false, error: 'Failed to approve quote' }, { status: 500 })
  }
}
