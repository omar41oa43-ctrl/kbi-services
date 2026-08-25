import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const snap = await adminDb.collection('parts').limit(1000).get()
    const parts = snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      }
    })
    return NextResponse.json({ success: true, parts })
  } catch (error: any) {
    console.error('Error fetching parts:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch parts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { partId, orderId, quantity = 1 } = body

    if (!partId) {
      return NextResponse.json({ success: false, error: 'partId is required' }, { status: 400 })
    }

    const partRef = adminDb.collection('parts').doc(partId)
    let partData: any = null

    await adminDb.runTransaction(async (transaction: any) => {
      const snap = await transaction.get(partRef)
      if (!snap.exists) {
        throw new Error('Part not found')
      }
      partData = snap.data()
      const currentQty = (partData?.quantity as number) || 0
      const newQty = Math.max(0, currentQty - quantity)
      transaction.update(partRef, {
        quantity: newQty,
        updatedAt: new Date(),
      })
    })

    if (orderId && partData) {
      const orderRef = adminDb.collection('orders').doc(orderId)
      const orderSnap = await orderRef.get()
      if (orderSnap.exists) {
        const existingParts = (orderSnap.data()?.usedParts as any[]) || []
        existingParts.push({
          partId,
          name: partData.name || 'Part',
          sku: partData.sku || '',
          price: partData.price || 0,
          category: partData.category || '',
          allocatedAt: new Date().toISOString(),
        })
        await orderRef.update({
          usedParts: existingParts,
          updatedAt: new Date(),
        })
      }
    }

    return NextResponse.json({ success: true, part: partData })
  } catch (error: any) {
    console.error('Error allocating part:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to allocate part' }, { status: 500 })
  }
}
