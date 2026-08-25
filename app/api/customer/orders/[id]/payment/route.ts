import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { method } = await request.json()
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    const allowedMethods = new Set(['CASH', 'CREDIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY'])
    if (!allowedMethods.has(method)) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 })
    }
    const order = await prisma.order.findUnique({
      where: { id, customerId: user.id },
      include: { quotes: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    const amount = order?.quotes[0]?.finalPrice
    if (!order || !amount || order.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Order is not ready for payment' }, { status: 409 })
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: id,
        userId: user.id,
        amount,
        method,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      payment,
      requiresProviderConfirmation: method !== 'CASH',
      message: 'Payment created as pending; completion requires trusted provider confirmation.',
    }, { status: 202 })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 })
  }
}
