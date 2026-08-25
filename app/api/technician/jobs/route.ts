import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // In a real app, you'd get the technician ID from the authenticated user
    // For now, we'll use a mock ID
    const mockTechnicianId = "tech-1"
    
    const jobs = await prisma.order.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "REVIEWING" },
          { technicianId: mockTechnicianId }
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
