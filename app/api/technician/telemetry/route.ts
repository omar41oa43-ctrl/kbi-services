import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { authenticateTechnician, findPrismaTechnician } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const identity = await authenticateTechnician(req);
    if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const technician = await findPrismaTechnician(identity);
    if (!technician) return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });

    const body = await req.json();
    const {
      latitude,
      longitude,
      batteryLevel,
      networkStatus,
      speed,
      heading,
      deviceModel,
      osVersion,
      appVersion,
      vehicle,
      currentJob,
      currentOrder,
      accuracy,
      ipAddress,
    } = body;
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
    }

    // 1. Record telemetry log in PostgreSQL
    await prisma.technicianTelemetry.create({
      data: {
        technicianId: technician.id,
        latitude: lat,
        longitude: lng,
        batteryLevel: batteryLevel !== undefined ? parseInt(batteryLevel) : 100,
        networkStatus: networkStatus || "4G",
        speed: speed !== undefined ? parseFloat(speed) : 0,
        heading: heading !== undefined ? parseFloat(heading) : 0,
        isOnline: true,
      },
    });

    // 2. Update current Technician record state in PostgreSQL
    await prisma.technician.update({
      where: { id: technician.id },
      data: {
        latitude: lat,
        longitude: lng,
        batteryLevel: batteryLevel !== undefined ? parseInt(batteryLevel) : 100,
        networkStatus: networkStatus || "4G",
        speed: speed !== undefined ? parseFloat(speed) : 0,
        heading: heading !== undefined ? parseFloat(heading) : 0,
        lastActive: new Date(),
      },
    });

    // 3. Update Firestore in real time for instant admin map display
    const db = getAdminDb();

    const firestoreUpdate: Record<string, any> = {
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      lastActive: FieldValue.serverTimestamp(),
      isOnline: true,
    };

    if (batteryLevel !== undefined) firestoreUpdate.batteryLevel = parseInt(batteryLevel);
    if (networkStatus) firestoreUpdate.networkStatus = networkStatus;
    if (speed !== undefined) firestoreUpdate.speed = parseFloat(speed);
    if (heading !== undefined) firestoreUpdate.heading = parseFloat(heading);
    if (deviceModel) firestoreUpdate.deviceModel = deviceModel;
    if (osVersion) firestoreUpdate.osVersion = osVersion;
    if (appVersion) firestoreUpdate.appVersion = appVersion;
    if (vehicle) firestoreUpdate.vehicle = vehicle;
    if (currentJob || currentOrder) firestoreUpdate.currentJob = currentJob || currentOrder;
    if (accuracy !== undefined) firestoreUpdate.accuracy = Number(accuracy);
    if (ipAddress) firestoreUpdate.ipAddress = ipAddress;

    await db
      .collection("technicians")
      .doc(identity.uid)
      .set(firestoreUpdate, { merge: true });

    return NextResponse.json({ success: true, timestamp: new Date() });
  } catch (error: any) {
    console.error("Technician Telemetry API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to record telemetry" }, { status: 500 });
  }
}
