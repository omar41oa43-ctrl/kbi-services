import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const technician = await findPrismaTechnician(identity)
    if (!technician) return NextResponse.json({ success: false, error: 'Technician profile not found' }, { status: 404 })

    const claimed = await prisma.order.updateMany({
      where: {
        id,
        technicianId: null,
        status: { in: ['PENDING', 'REVIEWING'] },
      },
      data: { status: 'ASSIGNED', technicianId: technician.id },
    })
    if (claimed.count !== 1) {
      return NextResponse.json({ success: false, error: 'Job is no longer available' }, { status: 409 })
    }

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "ASSIGNED",
        changedBy: identity.uid,
      },
    })

    const job = await prisma.order.findUniqueOrThrow({ where: { id } })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error accepting job:', error)
    return NextResponse.json({ success: false, error: 'Failed to accept job' }, { status: 500 })
  }
}
