import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTechnician, findPrismaTechnician } from '@/lib/api-auth'

export async function POST(request: Request) {
  try {
    const identity = await authenticateTechnician(request)
    if (!identity) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const technician = await findPrismaTechnician(identity)
    if (!technician) return NextResponse.json({ success: false, error: 'Technician profile not found' }, { status: 404 })

    const body = await request.json();
    const { latitude, longitude, deviceModel, osVersion, platform } = body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    let detectedModel = deviceModel;
    let detectedOs = osVersion;

    if (!detectedModel) {
      if (userAgent.includes("iPhone")) detectedModel = "iPhone";
      else if (userAgent.includes("iPad")) detectedModel = "iPad";
      else if (userAgent.includes("Android")) detectedModel = "Android Device";
      else if (userAgent.includes("Macintosh")) detectedModel = "Mac";
      else if (userAgent.includes("Windows")) detectedModel = "Windows PC";
    }

    if (!detectedOs) {
      if (userAgent.includes("iPhone OS")) {
        const match = userAgent.match(/iPhone OS ([\d_]+)/);
        detectedOs = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
      } else if (userAgent.includes("Android")) {
        const match = userAgent.match(/Android ([\d.]+)/);
        detectedOs = match ? `Android ${match[1]}` : "Android";
      } else if (userAgent.includes("Mac OS X")) {
        detectedOs = "macOS";
      }
    }

    // Create location record
    await prisma.technicianLocation.create({
      data: {
        technicianId: technician.id,
        latitude: lat,
        longitude: lng,
      },
    });

    // Update technician's current location in PostgreSQL
    await prisma.technician.update({
      where: { id: technician.id },
      data: {
        latitude: lat,
        longitude: lng,
        lastActive: new Date(),
      },
    });

    // Sync to Firestore for real-time tracking
    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const { FieldValue } = await import("firebase-admin/firestore");
      const db = getAdminDb();
      const firestoreData: Record<string, any> = {
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        lastActive: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (detectedModel) firestoreData.deviceModel = detectedModel;
      if (detectedOs) firestoreData.osVersion = detectedOs;
      if (platform) firestoreData.platform = platform;

      await db.collection("technicians").doc(identity.uid).set(firestoreData, { merge: true });
    } catch (e) {
      console.warn("Firestore location sync warning:", e);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 })
  }
}
