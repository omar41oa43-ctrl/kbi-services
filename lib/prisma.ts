import { FieldValue } from "firebase-admin/firestore"

import { getAdminDb } from "@/lib/firebase-admin"

type Data = Record<string, any>

const collectionNames: Record<string, string> = {
  user: "users",
  order: "orders",
  device: "devices",
  orderStatusHistory: "order_status_history",
  customerTimeline: "customer_timeline",
  technician: "technicians",
  technicianLocation: "technician_locations",
  payment: "payments",
  invoice: "invoices",
  review: "reviews",
  warranty: "warranties",
  technicianTelemetry: "technician_telemetry",
  remoteCommand: "remote_commands",
  auditLog: "audit_logs",
  inventoryItem: "inventory_items",
  technicianInventory: "technician_inventory",
  quote: "quotes",
  automationRule: "automation_rules",
  automationExecution: "automation_executions",
}

const collectionFor = (model: string) => collectionNames[model] || `${model.replace(/[A-Z]/g, (value) => `_${value.toLowerCase()}`)}s`

const plain = (value: any): any => {
  if (value == null) return value
  if (typeof value?.toDate === "function") return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(plain)
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, plain(nested)]))
  }
  return value
}

const normalizeWrite = (data: Data) => Object.fromEntries(
  Object.entries(data).map(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (typeof value.increment === "number") return [key, FieldValue.increment(value.increment)]
      if (typeof value.decrement === "number") return [key, FieldValue.increment(-value.decrement)]
    }
    return [key, value]
  }),
)

const comparable = (value: any) => value?.toDate?.().getTime?.() ?? (value instanceof Date ? value.getTime() : value)

const matches = (record: Data, where?: Data): boolean => {
  if (!where || !Object.keys(where).length) return true
  if (Array.isArray(where.OR) && !where.OR.some((entry: Data) => matches(record, entry))) return false
  if (Array.isArray(where.AND) && !where.AND.every((entry: Data) => matches(record, entry))) return false

  return Object.entries(where).every(([key, expected]) => {
    if (key === "OR" || key === "AND") return true
    if (key.includes("_")) {
      const values = expected as Data
      if (values && typeof values === "object" && Object.keys(values).every((field) => record[field] === values[field])) return true
    }
    const actual = record[key]
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("in" in expected && !expected.in.includes(actual)) return false
      if ("not" in expected && actual === expected.not) return false
      if ("equals" in expected && actual !== expected.equals) return false
      if ("gte" in expected && comparable(actual) < comparable(expected.gte)) return false
      if ("lte" in expected && comparable(actual) > comparable(expected.lte)) return false
      return true
    }
    return actual === expected
  })
}

const project = (record: Data, select?: Data) => {
  if (!select) return record
  return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, record[key]]))
}

const hydrate = async (model: string, record: Data, include?: Data) => {
  if (!include) return record
  const db = getAdminDb()
  const next = { ...record }

  if (model === "order") {
    if (include.customer && record.customerId) {
      const customer = await db.collection("users").doc(String(record.customerId)).get()
      next.customer = customer.exists ? plain({ id: customer.id, ...customer.data() }) : null
    }
    if (include.devices) {
      const devices = await db.collection("devices").where("orderId", "==", record.id).limit(100).get()
      next.devices = devices.docs.map((doc) => plain({ id: doc.id, ...doc.data() }))
    }
    if (include.statusHistory) {
      const history = await db.collection("order_status_history").where("orderId", "==", record.id).limit(200).get()
      next.statusHistory = history.docs.map((doc) => plain({ id: doc.id, ...doc.data() }))
    }
    if (include.quotes) {
      const quotes = await db.collection("quotes").where("orderId", "==", record.id).limit(100).get()
      next.quotes = quotes.docs.map((doc) => plain({ id: doc.id, ...doc.data() }))
    }
    if (include.technician && record.technicianId) {
      const technician = await db.collection("technicians").doc(String(record.technicianId)).get()
      next.technician = technician.exists ? plain({ id: technician.id, ...technician.data() }) : null
    }
  }

  if (model === "technician" && include.user && record.userId) {
    const user = await db.collection("users").doc(String(record.userId)).get()
    next.user = user.exists ? plain({ id: user.id, ...user.data() }) : null
  }

  return next
}

const createModel = (model: string) => {
  const collectionName = collectionFor(model)

  const findMany = async (args: Data = {}) => {
    const snapshot = await getAdminDb().collection(collectionName).limit(Math.min(Number(args.take || 500), 500)).get()
    let rows: Data[] = snapshot.docs
      .map((doc): Data => ({ id: doc.id, ...doc.data() }))
      .filter((row) => matches(row, args.where))

    if (args.orderBy) {
      const [field, direction] = Object.entries(args.orderBy)[0] as [string, "asc" | "desc"]
      rows = rows.sort((left, right) => {
        const result = comparable(left[field]) > comparable(right[field]) ? 1 : comparable(left[field]) < comparable(right[field]) ? -1 : 0
        return direction === "desc" ? -result : result
      })
    }
    if (args.take) rows = rows.slice(0, Number(args.take))

    return Promise.all(rows.map(async (row) => project(plain(await hydrate(model, row, args.include)), args.select)))
  }

  const findUnique = async (args: Data) => {
    const where = args?.where || {}
    if (typeof where.id === "string") {
      const snapshot = await getAdminDb().collection(collectionName).doc(where.id).get()
      if (!snapshot.exists) return null
      return project(plain(await hydrate(model, { id: snapshot.id, ...snapshot.data() }, args.include)), args.select)
    }
    return (await findMany({ where, include: args.include, select: args.select, take: 1 }))[0] || null
  }

  const create = async (args: Data) => {
    const data = normalizeWrite(args.data || {})
    const requestedId = typeof data.id === "string" ? data.id : undefined
    const reference = requestedId
      ? getAdminDb().collection(collectionName).doc(requestedId)
      : getAdminDb().collection(collectionName).doc()
    const payload: Data = { ...data, createdAt: data.createdAt || FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }
    delete payload.id
    await reference.set(payload)
    return plain({ id: reference.id, ...args.data })
  }

  const update = async (args: Data) => {
    const current = await findUnique({ where: args.where })
    if (!current) throw new Error(`${model} not found`)
    const reference = getAdminDb().collection(collectionName).doc(current.id)
    await reference.set({ ...normalizeWrite(args.data || {}), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    const updated = await reference.get()
    return plain({ id: updated.id, ...updated.data() })
  }

  const updateMany = async (args: Data) => getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(getAdminDb().collection(collectionName).limit(500))
    const selected = snapshot.docs.filter((doc) => matches({ id: doc.id, ...doc.data() }, args.where))
    selected.forEach((doc) => transaction.set(doc.ref, {
      ...normalizeWrite(args.data || {}),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }))
    return { count: selected.length }
  })

  const upsert = async (args: Data) => {
    const current = await findUnique({ where: args.where })
    return current
      ? update({ where: { id: current.id }, data: args.update })
      : create({ data: { ...args.create, ...args.where } })
  }

  const createMany = async (args: Data) => {
    const entries = Array.isArray(args.data) ? args.data : [args.data]
    const batch = getAdminDb().batch()
    entries.forEach((entry: Data) => {
      const reference = getAdminDb().collection(collectionName).doc()
      batch.set(reference, { ...normalizeWrite(entry), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
    })
    await batch.commit()
    return { count: entries.length }
  }

  return {
    findMany,
    findUnique,
    findUniqueOrThrow: async (args: Data) => {
      const record = await findUnique(args)
      if (!record) throw new Error(`${model} not found`)
      return record
    },
    create,
    createMany,
    update,
    updateMany,
    upsert,
  }
}

const modelCache = new Map<string, ReturnType<typeof createModel>>()
const prisma = new Proxy({}, {
  get(_target, property) {
    const model = String(property)
    if (!modelCache.has(model)) modelCache.set(model, createModel(model))
    return modelCache.get(model)
  },
}) as any

export default prisma
export { prisma }
