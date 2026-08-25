import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const mockTechnicianId = "tech-1" // Replace with authenticated user ID in production

    const job = await prisma.order.update({
      where: { id },
      data: {
        status: "ASSIGNED",
        technicianId: mockTechnicianId,
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "ASSIGNED",
        changedBy: mockTechnicianId,
      },
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error accepting job:', error)
    return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 })
  }
}
