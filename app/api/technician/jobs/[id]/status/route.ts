import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { status } = await request.json()
    const mockTechnicianId = "tech-1"

    const job = await prisma.order.update({
      where: { id },
      data: { status },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedBy: mockTechnicianId,
      },
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error updating job status:', error)
    return NextResponse.json({ success: false, error: 'Failed to update job status' }, { status: 500 })
  }
}
