import { prisma } from '#/db'
import { requireAdminFnMiddleware } from '#/middleware/auth'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import {
  createManualOrderSchema,
  getAdminOrdersSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from '#/schemas/order-schemas'
import type { ValidateSearchOrderSchema } from '#/schemas/order-schemas'

const TAKE = 20

// ─── Invoice number generator ─────────────────────────────────────────────────

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfMonth } },
  })

  const seq = String(count + 1).padStart(4, '0')
  return `INV-${yyyymm}-${seq}`
}

// ─── Select ───────────────────────────────────────────────────────────────────

const adminOrderSelect = {
  id: true,
  invoiceNumber: true,
  source: true,
  externalOrderId: true,
  customerName: true,
  customerEmail: true,
  status: true,
  total: true,
  shippingCost: true,
  subtotal: true,
  createdAt: true,
  trackingNumber: true,
  user: { select: { name: true, email: true } },
  items: {
    select: {
      id: true,
      qty: true,
      unitPrice: true,
      total: true,
      productSnapshot: true,
    },
  },
} as const

// ─── Server functions ─────────────────────────────────────────────────────────

export const getAdminOrdersFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(getAdminOrdersSchema)
  .handler(async ({ data }) => {
    const skip = (data.page - 1) * TAKE

    const where = {
      ...(data.status ? { status: data.status } : {}),
      ...(data.source ? { source: data.source } : {}),
      ...(data.search
        ? {
            OR: [
              {
                invoiceNumber: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                externalOrderId: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                customerName: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                user: {
                  email: {
                    contains: data.search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: adminOrderSelect,
        orderBy: { createdAt: 'desc' },
        take: TAKE,
        skip,
      }),
      prisma.order.count({ where }),
    ])

    return { orders, total, pages: Math.ceil(total / TAKE) }
  })

export const getAdminOrderByIdFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(orderIdSchema)
  .handler(async ({ data }) => {
    return prisma.order.findFirstOrThrow({
      where: { id: data.id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        items: {
          include: {
            product: { select: { name: true, slug: true } },
          },
        },
      },
    })
  })

export const createManualOrderFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(createManualOrderSchema)
  .handler(async ({ data }) => {
    const invoiceNumber = await generateInvoiceNumber()

    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
    const total = subtotal + data.shippingCost

    return prisma.order.create({
      data: {
        invoiceNumber,
        source: data.source,
        externalOrderId: data.externalOrderId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        status: data.status,
        subtotal,
        shippingCost: data.shippingCost,
        total,
        shippingAddress: data.shippingAddress,
        notes: data.notes || null,
        paidAt: data.status !== 'PENDING_PAYMENT' ? new Date() : null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.qty,
            productSnapshot: {},
          })),
        },
      },
      select: { id: true, invoiceNumber: true },
    })
  })

export const updateOrderStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(updateOrderStatusSchema)
  .handler(async ({ data }) => {
    return prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(data.courier ? { courier: data.courier } : {}),
        ...(data.trackingNumber ? { trackingNumber: data.trackingNumber } : {}),
        ...(data.trackingUrl ? { trackingUrl: data.trackingUrl } : {}),
        ...(data.adminNotes !== undefined
          ? { adminNotes: data.adminNotes }
          : {}),
        ...(data.status === 'PAID' ? { paidAt: new Date() } : {}),
      },
      select: { id: true, status: true },
    })
  })

// ─── Query options ────────────────────────────────────────────────────────────

export const adminOrderQueryOptions = (search: ValidateSearchOrderSchema) =>
  queryOptions({
    queryKey: ['admin', 'orders', search],
    queryFn: () => getAdminOrdersFn({ data: search }),
  })

export const adminOrderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'orders', id],
    queryFn: () => getAdminOrderByIdFn({ data: { id } }),
  })
