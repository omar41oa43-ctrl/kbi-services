import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { amount, method, transactionId } = await request.json()
    const mockUserId = 'cust-1'

    const payment = await prisma.payment.create({
      data: {
        orderId: id,
        userId: mockUserId,
        amount,
        method,
        status: 'COMPLETED',
        transactionId,
        paidAt: new Date(),
      },
    })

    // Update order status to completed
    await prisma.order.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    // Create warranty
    const order = await prisma.order.findUnique({ where: { id } })
    if (order) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6) // 6 months warranty
      await prisma.warranty.create({
        data: {
          orderId: id,
          userId: mockUserId,
          startDate,
          endDate,
        },
      })
    }

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 })
  }
}
