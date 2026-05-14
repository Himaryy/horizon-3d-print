import { prisma } from '#/db'
import { OrderStatus, CustomOrderStatus } from '#/generated/prisma/enums'
import { requireAdminFnMiddleware } from '#/middleware/auth'
import { createServerFn } from '@tanstack/react-start'

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .handler(async () => {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.PRINTING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ]

    const [
      // users,
      products,
      orders,
      revenue,
      pendingOrders,
      recentOrders,
      pendingCustomRequests,
      chartOrders,
    ] = await Promise.all([
      // prisma.user.count(),
      prisma.product.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: paidStatuses } },
      }),
      prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PROCESSING,
              OrderStatus.PRINTING,
            ],
          },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          customerName: true,
          customerEmail: true,
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.customOrderRequest.findMany({
        where: { status: CustomOrderStatus.NEW },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          description: true,
          budgetMin: true,
          budgetMax: true,
          guestEmail: true,
          guestName: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          status: { in: paidStatuses },
        },
        select: { createdAt: true, total: true },
      }),
    ])

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

    const monthlyRevenue = months.map(({ year, month }) => {
      const label = new Date(year, month, 1).toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      })
      const total = chartOrders
        .filter(
          (o) =>
            o.createdAt.getFullYear() === year &&
            o.createdAt.getMonth() === month,
        )
        .reduce((sum, o) => sum + o.total, 0)
      return { month: label, revenue: total }
    })

    return {
      // users,
      products,
      orders,
      revenue: revenue._sum.total ?? 0,
      pendingOrders,
      recentOrders,
      pendingCustomRequests,
      monthlyRevenue,
    }
  })
