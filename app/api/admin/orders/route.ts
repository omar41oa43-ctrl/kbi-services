import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  if (!await authenticateAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        devices: true,
      },
    })
    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}
