import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { serviceRating, technicianRating, comment, imageUrl } = await request.json()
    const mockUserId = 'cust-1'

    const order = await prisma.order.findUnique({
      where: { id, customerId: mockUserId },
      select: { technicianId: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        orderId: id,
        userId: mockUserId,
        technicianId: order.technicianId,
        serviceRating,
        technicianRating,
        comment,
        imageUrl,
      },
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 })
  }
}
