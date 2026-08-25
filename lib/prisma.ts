// For now, we'll use a mock adapter since we don't have a PostgreSQL database configured yet
// In production, you'll need to install @prisma/pg and use the PrismaPg adapter
const mockOrders = [
  {
    id: "order-1", orderNumber: "KBI-000001", customerId: "cust-1", description: "Screen repair", address: "123 Main St", status: "PENDING", images: [], createdAt: new Date().toISOString(), devices: [{ id: "dev-1", category: "Smartphone", brand: "Apple", model: "iPhone 15", issue: "Cracked screen" }],
  },
  {
    id: "order-2", orderNumber: "KBI-000002", customerId: "cust-2", description: "Battery replacement", address: "456 Oak Ave", status: "IN_PROGRESS", images: [], createdAt: new Date().toISOString(), devices: [{ id: "dev-2", category: "Laptop", brand: "Dell", model: "XPS 13", issue: "Battery not charging" }],
  },
]

const mockUsers = [
  { id: "cust-1", name: "John Doe", email: "john@example.com", phone: "0501234567", role: "CUSTOMER" },
  { id: "cust-2", name: "Jane Smith", email: "jane@example.com", phone: "0509876543", role: "CUSTOMER" },
  { id: "tech-1", name: "Ahmed Technician", email: "ahmed@kbi.ae", phone: "0551112222", role: "TECHNICIAN" },
]

const mockTechnicians = [
  {
    id: "tech-1",
    userId: "tech-1",
    status: "APPROVED",
    available: true,
    rating: 4.9,
    experienceYears: 5,
    specialization: "Smartphones & Laptops",
    serviceAreas: ["Dubai", "Abu Dhabi"],
  },
]

const prismaClientSingleton = () => {
  // Return a mock prisma client for development without PostgreSQL
  console.warn("DATABASE_URL not set, using mock Prisma client")
  return {
    user: {
      upsert: async () => ({ id: "mock-user-id", name: "Mock User", phone: "0000000000" }),
      findMany: async () => mockUsers,
      findUnique: async (args: any) => mockUsers.find(u => u.id === args.where.id || u.phone === args.where.phone),
    },
    order: {
      findMany: async () => mockOrders,
      findUnique: async (args: any) => mockOrders.find(o => o.id === args.where.id || o.orderNumber === args.where.orderNumber),
      create: async (data: any) => ({ id: "new-mock-order", orderNumber: data.data.orderNumber, devices: [] }),
      update: async (args: any) => ({ ...mockOrders[0], ...args.data }),
    },
    device: {
      createMany: async () => ({ count: 1 }),
    },
    orderStatusHistory: {
      create: async () => ({ id: "hist-1", status: "PENDING", changedAt: new Date().toISOString() }),
    },
    technician: {
      findMany: async () => mockTechnicians,
      findUnique: async (args: any) => mockTechnicians.find(t => t.id === args.where.id || t.userId === args.where.userId),
      create: async () => ({ id: "tech-1" }),
      update: async (args: any) => ({ ...mockTechnicians[0], ...args.data }),
    },
    technicianLocation: {
      create: async () => ({ id: "loc-1" }),
      findMany: async () => [],
    },
    payment: {
      create: async (args: any) => ({ id: "pay-1", ...args.data }),
    },
    invoice: {
      create: async (args: any) => ({ id: "inv-1", ...args.data }),
    },
    review: {
      create: async (args: any) => ({ id: "rev-1", ...args.data }),
    },
    warranty: {
      findMany: async () => [],
      create: async (args: any) => ({ id: "war-1", ...args.data }),
    },
  } as any
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
