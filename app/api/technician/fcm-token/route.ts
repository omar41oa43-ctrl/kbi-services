import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'

import { authenticateTechnician } from '@/lib/api-auth'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { token?: unknown; enabled?: unknown }
    const enabled = body.enabled === true
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (enabled && !token) {
      return NextResponse.json(
        { success: false, error: 'A valid notification token is required' },
        { status: 400 },
      )
    }

    await getAdminDb().collection('technicians').doc(identity.uid).set(
      {
        fcmToken: enabled ? token : null,
        notificationsEnabled: enabled,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('Unable to update technician notification token:', error)
    return NextResponse.json(
      { success: false, error: 'Unable to update notification settings' },
      { status: 500 },
    )
  }
}
