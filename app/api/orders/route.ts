import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      customerName, 
      phone, 
      email, 
      address, 
      latitude, 
      longitude,
      devices,
      description
    } = body

    if (!customerName || !phone || !devices || devices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const orderNumbers = await prisma.order.findMany({
      select: { orderNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 1
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
      }
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
      }
    })

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
