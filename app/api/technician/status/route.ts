import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

export async function POST(request: Request) {
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { mode, isOnline, isAvailable } = await request.json()
    const validMode = mode || (isOnline ? (isAvailable ? 'available' : 'busy') : 'offline')
    const online = validMode !== 'offline'
    const available = validMode === 'available'
    const status = validMode.toUpperCase() === 'BUSY' ? 'BUSY' : (available ? 'AVAILABLE' : 'OFFLINE')

    // 1. Update in PostgreSQL via Prisma if technician record exists
    try {
      const technician = await findPrismaTechnician(identity)
      if (technician) {
        await prisma.technician.update({
          where: { id: technician.id },
          data: {
            isOnline: online,
            isAvailable: available,
            lastActive: new Date(),
          },
        })
      }
    } catch (e) {
      console.warn('Prisma status update warning:', e)
    }

    // 2. Update Firestore with Admin Privileges (bypasses client security rules)
    const db = getAdminDb()
    await db.collection('technicians').doc(identity.uid).set(
      {
        isOnline: online,
        online: online,
        isAvailable: available,
        available: available,
        availability: validMode,
        status: status,
        lastActive: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      availability: validMode,
      isOnline: online,
      isAvailable: available,
      status: status,
    })
  } catch (error) {
    console.error('Error updating technician availability status:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 500 }
    )
  }
}
