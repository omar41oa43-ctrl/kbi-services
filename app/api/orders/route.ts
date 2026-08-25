import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import prisma from "@/lib/prisma"
import { getClientIP, rateLimit } from "@/lib/rate-limit"

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  description: z.string().trim().max(2000).optional(),
  devices: z.array(z.object({
    category: z.string().trim().min(1).max(80),
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(120),
    issue: z.string().trim().max(1000).optional(),
  })).min(1).max(10),
})

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`public-order:${getClientIP(request)}`, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    })
    if (!limiter.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Try again later." },
        { status: 429 },
      )
    }

    const parsed = orderSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid booking details" },
        { status: 400 },
      )
    }

    const { customerName, phone, email, address, latitude, longitude, devices, description } = parsed.data
    const orderNumber = `KBI-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`
    const existingUser = await prisma.user.findUnique({ where: { phone } })
    const user = existingUser
      ? await prisma.user.update({ where: { id: existingUser.id }, data: { name: customerName } })
      : await prisma.user.create({
          data: { name: customerName, phone, email: email || null, role: "CUSTOMER" },
        })

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: user.id,
        description: description || null,
        address: address || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        images: [],
        devices: {
          create: devices.map((device) => ({
            category: device.category,
            brand: device.brand,
            model: device.model,
            issue: device.issue || "",
          })),
        },
      },
      include: { devices: true },
    })

    return NextResponse.json(
      { success: true, orderNumber: order.orderNumber, orderId: order.id },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 },
    )
  }
}
