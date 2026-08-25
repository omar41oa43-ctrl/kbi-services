import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateCustomer, findPrismaUser } from '@/lib/api-auth'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
  try {
    const identity = await authenticateCustomer(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = await findPrismaUser(identity)
    if (!user) return NextResponse.json({ success: true, orders: [] })

    const orders = await prisma.order.findMany({
      where: {
        customerId: user.id,
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
    const identity = await authenticateCustomer(request)
    if (!identity || !identity.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { customerName, phone, address, latitude, longitude, devices, description } = body
    if (!customerName?.trim() || !Array.isArray(devices) || devices.length < 1 || devices.length > 10) {
      return NextResponse.json({ success: false, error: 'Customer name and 1-10 devices are required' }, { status: 400 })
    }
    const lat = latitude === undefined || latitude === null ? null : Number(latitude)
    const lng = longitude === undefined || longitude === null ? null : Number(longitude)
    if ((lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
        (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))) {
      return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 })
    }

    let user = await findPrismaUser(identity)
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: customerName.trim(),
          phone: phone?.trim() || null,
          email: identity.email,
          role: 'CUSTOMER',
        },
      })
    }

    const orderNumber = `KBI-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        description: description || null,
        address: address || null,
        latitude: lat,
        longitude: lng,
        images: [],
        devices: {
          create: devices.map((device: Record<string, unknown>) => ({
            category: String(device.category || '').trim(),
            brand: String(device.brand || '').trim(),
            model: String(device.model || '').trim(),
            issue: String(device.issue || '').trim(),
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
