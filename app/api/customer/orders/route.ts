import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // In real app, get userId from authenticated session
    const mockUserId = 'cust-1'

    const orders = await prisma.order.findMany({
      where: {
        customerId: mockUserId,
      },
      include: {
        devices: true,
        technician: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // In real app, get userId from authenticated session
    const mockUserId = 'cust-1'
    const body = await request.json()
    const { customerName, phone, email, address, latitude, longitude, devices, description } = body

    const orderNumbers = await prisma.order.findMany({
      select: { orderNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    let nextOrderNumber = 1
    if (orderNumbers.length > 0) {
      const lastOrderNumber = orderNumbers[0].orderNumber
      const match = lastOrderNumber.match(/KBI-(\d+)/)
      if (match) {
        nextOrderNumber = parseInt(match[1]) + 1
      }
    }
    const orderNumber = `KBI-${nextOrderNumber.toString().padStart(6, '0')}`

    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        name: customerName,
        email: email || null,
      },
      create: {
        name: customerName,
        phone,
        email: email || null,
        role: 'CUSTOMER',
      },
    })

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        description: description || null,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: [],
        devices: {
          create: devices.map((device: any) => ({
            category: device.category,
            brand: device.brand,
            model: device.model,
            issue: device.issue || '',
          })),
        },
      },
      include: {
        devices: true,
      },
    })

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
  }
}
