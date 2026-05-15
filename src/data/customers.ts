import { prisma } from '#/db'
import { requireAdminFnMiddleware } from '#/middleware/auth'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { getAdminCustomersSchema } from '#/schemas/customer-schemas'
import type { ValidateSearchCustomerSchema } from '#/schemas/customer-schemas'

const TAKE = 10

// ─── Select ───────────────────────────────────────────────────────────────────

const customerSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  _count: {
    select: { orders: true, reviews: true, customOrders: true },
  },
  orders: {
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          qty: true,
          unitPrice: true,
          productSnapshot: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  customOrders: {
    select: {
      id: true,
      status: true,
      description: true,
      budgetMin: true,
      budgetMax: true,
      quotedPrice: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' as const },
  },
  addresses: {
    select: {
      id: true,
      label: true,
      name: true,
      phone: true,
      street: true,
      city: true,
      province: true,
      postal: true,
      isDefault: true,
    },
  },
  reviews: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const

// ─── Server functions ─────────────────────────────────────────────────────────

export const getAdminCustomersFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(getAdminCustomersSchema)
  .handler(async ({ data }) => {
    const skip = (data.page - 1) * TAKE

    const where = {
      orders: { some: {} },
      ...(data.search
        ? {
            OR: [
              { name: { contains: data.search, mode: 'insensitive' as const } },
              {
                email: { contains: data.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: customerSelect,
        orderBy: { createdAt: 'desc' },
        take: TAKE,
        skip,
      }),
      prisma.user.count({ where }),
    ])

    const customers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      orderCount: u._count.orders,
      reviewCount: u._count.reviews,
      customOrderCount: u._count.customOrders,
      totalSpent: u.orders.reduce((sum: number, o) => sum + o.total, 0),
      lastOrderAt: u.orders[0]?.createdAt ?? null,
      addresses: u.addresses,
      reviews: u.reviews,
      orders: u.orders,
      customOrders: u.customOrders,
    }))

    return { customers, total, pages: Math.ceil(total / TAKE) }
  })

// ─── Query options ────────────────────────────────────────────────────────────

export const adminCustomersQueryOptions = (
  search: ValidateSearchCustomerSchema,
) =>
  queryOptions({
    queryKey: ['admin', 'customers', search],
    queryFn: () => getAdminCustomersFn({ data: search }),
  })
