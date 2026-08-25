import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const technician = await findPrismaTechnician(identity)
    if (!technician) return NextResponse.json({ success: false, error: 'Technician profile not found' }, { status: 404 })
    
    const jobs = await prisma.order.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "REVIEWING" },
          { technicianId: technician.id }
        ]
      },
      include: {
        customer: true,
        devices: true,
      },
    })

    return NextResponse.json({ success: true, jobs })
  } catch (error) {
    console.error('Error fetching technician jobs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
