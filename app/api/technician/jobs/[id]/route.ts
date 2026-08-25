import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const technician = await findPrismaTechnician(identity)
    if (!technician) return NextResponse.json({ success: false, error: 'Technician profile not found' }, { status: 404 })

    const job = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        devices: true,
        statusHistory: true,
        quotes: true,
        technician: true,
      },
    })
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 })
    }
    const isOpen = job.status === 'PENDING' || job.status === 'REVIEWING'
    if (!isOpen && job.technicianId !== technician.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch job' }, { status: 500 })
  }
}
