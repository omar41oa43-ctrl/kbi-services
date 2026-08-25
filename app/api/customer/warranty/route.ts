import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const mockUserId = 'cust-1'
    const warranties = await prisma.warranty.findMany({
      where: { userId: mockUserId },
      include: { order: { include: { devices: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, warranties })
  } catch (error) {
    console.error('Error fetching warranties:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch warranties' }, { status: 500 })
  }
}
