import { prisma } from "@/lib/prisma";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export interface RemoteCommandPayload {
  technicianId: string;
  action: "NAVIGATE" | "FORCE_LOGOUT" | "LOCK_SCREEN" | "POPUP_ALERT" | "EMERGENCY_ALERT" | "FORCE_SYNC" | "REQUEST_LOCATION";
  payload?: Record<string, any>;
  adminUser?: string;
}

export class AdminControlService {
  /**
   * Log administrative audit event to PostgreSQL
   */
  static async logAudit(params: {
    userId?: string;
    userRole?: string;
    action: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    device?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || "system_admin",
          userRole: params.userRole || "ADMIN",
          action: params.action,
          oldValue: params.oldValue ? JSON.stringify(params.oldValue) : undefined,
          newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
          ipAddress: params.ipAddress || "127.0.0.1",
          device: params.device || "Admin Web Dashboard",
        },
      });
    } catch (e) {
      console.error("[AuditLog Error]", e);
    }
  }

  /**
   * Dispatch remote command to technician app via Firestore real-time listener & FCM
   */
  static async sendRemoteCommand(command: RemoteCommandPayload) {
    const db = getAdminDb();

    // 1. Record command in PostgreSQL
    let dbCmd: { id: string; [key: string]: any } = {
      id: `firestore-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    try {
      dbCmd = await prisma.remoteCommand.create({
        data: {
          technicianId: command.technicianId,
          action: command.action,
          payload: command.payload || {},
          createdBy: command.adminUser || "admin",
          status: "PENDING",
        },
      });
    } catch (error) {
      // Some approved profiles exist only in Firebase Authentication and
      // Firestore. The command must still reach those active devices.
      console.warn("[Remote Command] PostgreSQL audit record unavailable", error);
    }

    // 2. Real-time broadcast to Firestore technician doc & remote_commands collection
    const cmdPayload = {
      cmdId: dbCmd.id,
      action: command.action,
      payload: command.payload || {},
      timestamp: FieldValue.serverTimestamp(),
      executed: false,
    };

    const techUpdate: Record<string, any> = {
      pendingRemoteCommand: cmdPayload,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (command.action === "LOCK_SCREEN") {
      techUpdate.isLocked = true;
    }

    await db
      .collection("technicians")
      .doc(command.technicianId)
      .set(techUpdate, { merge: true });

    await db.collection("remote_commands").doc(dbCmd.id).set(cmdPayload);

    // 3. Send High Priority Push Notification via FCM
    try {
      const techSnapshot = await db
        .collection("technicians")
        .doc(command.technicianId)
        .get();
      const fcmToken = techSnapshot.data()?.fcmToken;
      await getMessaging().send({
        ...(typeof fcmToken === "string" && fcmToken.trim()
          ? { token: fcmToken.trim() }
          : { topic: `tech_${command.technicianId}` }),
        notification: {
          title: command.action === "EMERGENCY_ALERT" ? "🚨 Emergency Alert" : "Admin Notice",
          body: command.payload?.message || `System Action: ${command.action}`,
        },
        data: {
          action: command.action,
          payload: JSON.stringify(command.payload || {}),
        },
        android: { priority: "high" },
      });
    } catch (fcmError) {
      console.warn("[FCM Dispatch Note] FCM topic broadcast failed", fcmError);
    }

    await this.logAudit({
      userId: command.adminUser,
      action: `REMOTE_COMMAND_${command.action}`,
      newValue: { technicianId: command.technicianId, payload: command.payload },
    });

    return dbCmd;
  }

  /**
   * Update technician account status (Approve, Suspend, Activate, Force Logout, Lock)
   */
  static async updateTechnicianStatus(
    technicianId: string,
    action: "APPROVE" | "REJECT" | "SUSPEND" | "ACTIVATE" | "FORCE_LOGOUT" | "LOCK" | "UNLOCK",
    adminUser: string = "admin"
  ) {
    const db = getAdminDb();

    const tech = await prisma.technician.findUnique({
      where: { id: technicianId },
      include: { user: true },
    });

    if (!tech) throw new Error("Technician not found");

    let updatedStatus = tech.status;
    let isSuspended = tech.isSuspended;
    let isLocked = tech.isLocked;

    if (action === "APPROVE") updatedStatus = "APPROVED";
    if (action === "REJECT") updatedStatus = "REJECTED";
    if (action === "SUSPEND") {
      updatedStatus = "SUSPENDED";
      isSuspended = true;
    }
    if (action === "ACTIVATE") {
      updatedStatus = "APPROVED";
      isSuspended = false;
    }
    if (action === "LOCK") isLocked = true;
    if (action === "UNLOCK") isLocked = false;

    // Update PostgreSQL
    const updatedTech = await prisma.technician.update({
      where: { id: technicianId },
      data: {
        status: updatedStatus,
        isSuspended,
        isLocked,
      },
    });

    // Update Firestore in real time
    await db.collection("technicians").doc(technicianId).set(
      {
        status: updatedStatus,
        isApproved: updatedStatus === "APPROVED",
        isActive: !isSuspended,
        isLocked,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // If Force Logout or Suspend, send remote command to client
    if (action === "FORCE_LOGOUT" || action === "SUSPEND") {
      await this.sendRemoteCommand({
        technicianId,
        action: "FORCE_LOGOUT",
        payload: { reason: `Account status updated to ${action}` },
        adminUser,
      });
    }

    await this.logAudit({
      userId: adminUser,
      action: `TECHNICIAN_${action}`,
      oldValue: { status: tech.status, isSuspended: tech.isSuspended },
      newValue: { status: updatedStatus, isSuspended, isLocked },
    });

    return updatedTech;
  }

  /**
   * Dispatch / Assign order to technician with immediate real-time synchronization
   */
  static async assignOrder(
    orderId: string,
    technicianId: string,
    adminUser: string = "admin",
    serviceAmount?: number
  ) {
    const db = getAdminDb();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        devices: true,
        quotes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    // Dispatching an order we cannot read would push a job with no customer,
    // address or coordinates to the technician's phone. Fail instead.
    if (!order) {
      throw new Error(`Cannot dispatch order ${orderId}: order not found`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { technicianId, status: "ASSIGNED" },
    });

    await prisma.orderStatusHistory.create({
      data: { orderId, status: "ASSIGNED", changedBy: adminUser },
    });

    // Price comes from the explicit dispatch amount, otherwise the latest
    // quote. When neither exists the job is dispatched unpriced and the
    // technician quotes on site — never a fabricated default.
    const quotedPrice = order.quotes[0]?.finalPrice;
    const price =
      serviceAmount ?? (quotedPrice != null ? Number(quotedPrice) : null);

    const primaryDevice = order.devices[0];
    const deviceLabel = primaryDevice
      ? `${primaryDevice.brand} ${primaryDevice.model}`.trim()
      : "";
    const hasCoords =
      typeof order.latitude === "number" && typeof order.longitude === "number";

    // Field names here are read directly by the technician app
    // (ServiceRequestModel.fromDoc and the job cards). Keep them in sync.
    const bookingPayload = {
      id: orderId,
      bookingId: orderId,
      orderNumber: order.orderNumber,
      assignedTechnician: technicianId,
      technicianId: technicianId,
      status: "Assigned",
      customerName: order.customer?.name ?? "",
      customerPhone: order.customer?.phone ?? "",
      address: order.address ?? "",
      ...(hasCoords
        ? {
            latitude: order.latitude,
            longitude: order.longitude,
            location: { lat: order.latitude, lng: order.longitude },
          }
        : {}),
      device: deviceLabel,
      service: deviceLabel,
      issue: primaryDevice?.issue ?? "",
      category: primaryDevice?.category ?? "",
      description: order.description ?? "",
      images: order.images ?? [],
      priority: "Normal",
      appointmentDate: order.createdAt,
      ...(price != null
        ? { serviceAmount: price, price, totalAmount: price }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 1. Sync to 'bookings' collection
    await db.collection("bookings").doc(orderId).set(bookingPayload, { merge: true });

    // 2. Sync to 'service_requests' collection
    await db.collection("service_requests").doc(orderId).set(bookingPayload, { merge: true });

    // 3. Sync to 'orders' collection
    await db.collection("orders").doc(orderId).set(
      {
        status: "Assigned",
        technicianId,
        ...(price != null ? { serviceAmount: price } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 4. Mark technician as unavailable & set current job in 'technicians' collection
    await db.collection("technicians").doc(technicianId).set(
      {
        currentJob: orderId,
        available: false,
        pendingRemoteCommand: {
          cmdId: `cmd-${Date.now()}`,
          action: "NAVIGATE",
          payload: {
            screen: "INCOMING_ORDER",
            orderId: orderId,
            booking: bookingPayload,
            serviceAmount: price,
            price: price,
          },
          createdAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 5. Send Remote Command / FCM to prompt Incoming Order Screen on Flutter app
    await this.sendRemoteCommand({
      technicianId,
      action: "NAVIGATE",
      payload: {
        screen: "INCOMING_ORDER",
        orderId: orderId,
        booking: bookingPayload,
        serviceAmount: price,
        price: price,
      },
      adminUser,
    });

    await this.logAudit({
      userId: adminUser,
      action: "ASSIGN_ORDER",
      oldValue: { status: order?.status, technicianId: order?.technicianId },
      newValue: { status: "ASSIGNED", technicianId, serviceAmount: price },
    });

    return bookingPayload;
  }

  /**
   * Consume Spare Parts from Technician Kit and Warehouse Inventory
   */
  static async consumeInventoryPart(
    technicianId: string,
    orderId: string,
    partSku: string,
    quantity: number,
    adminUser: string = "admin"
  ) {
    const item = await prisma.inventoryItem.findUnique({
      where: { sku: partSku },
    });

    if (!item) throw new Error("Part SKU not found");

    // Reduce warehouse inventory
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        warehouseQty: { decrement: quantity },
      },
    });

    // Upsert technician local inventory
    await prisma.technicianInventory.upsert({
      where: {
        technicianId_itemId: {
          technicianId,
          itemId: item.id,
        },
      },
      update: {
        quantity: { decrement: quantity },
      },
      create: {
        technicianId,
        itemId: item.id,
        quantity: 0,
      },
    });

    // Add cost to quote/order
    await prisma.quote.create({
      data: {
        orderId,
        partsCost: Number(item.unitPrice) * quantity,
        notes: `Part consumed: ${item.name} (x${quantity})`,
      },
    });

    await this.logAudit({
      userId: adminUser,
      action: "CONSUME_INVENTORY",
      newValue: { technicianId, orderId, partSku, quantity, cost: Number(item.unitPrice) * quantity },
    });
  }
}
