import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { serviceRating, technicianRating, comment, imageUrl } = await request.json()
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    const sr = Number(serviceRating)
    const tr = technicianRating === undefined || technicianRating === null ? null : Number(technicianRating)
    if (!Number.isInteger(sr) || sr < 1 || sr > 5 || (tr !== null && (!Number.isInteger(tr) || tr < 1 || tr > 5))) {
      return NextResponse.json({ success: false, error: 'Ratings must be between 1 and 5' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id, customerId: user.id, status: 'COMPLETED' },
      select: { technicianId: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const review = await prisma.review.create({
      data: {
        orderId: id,
        userId: user.id,
        technicianId: order.technicianId,
        serviceRating: sr,
        technicianRating: tr,
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
