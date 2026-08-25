import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  if (!await authenticateAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      include: {
        customerAddresses: true,
        customerTags: { include: { tag: true } },
        customerTimeline: { orderBy: { createdAt: 'desc' } },
        orders: {
          include: { devices: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        reviews: true,
        warranties: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
  }
}
