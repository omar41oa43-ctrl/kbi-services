import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
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
    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch job' }, { status: 500 })
  }
}
