import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  try {
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: true, warranties: [] })
    const warranties = await prisma.warranty.findMany({
      where: { userId: user.id },
      include: { order: { include: { devices: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, warranties })
  } catch (error) {
    console.error('Error fetching warranties:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch warranties' }, { status: 500 })
  }
}
