import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json()
    const mockTechnicianId = "tech-1"

    // Create location record
    await prisma.technicianLocation.create({
      data: {
        technicianId: mockTechnicianId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    })

    // Update technician's current location
    await prisma.technician.update({
      where: { id: mockTechnicianId },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        lastActive: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 })
  }
}
