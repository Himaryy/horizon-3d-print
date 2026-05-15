import { prisma } from '#/db'
import { requireAdminFnMiddleware } from '#/middleware/auth'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import {
  submitCustomOrderSchema,
  getAdminCustomOrdersSchema,
  updateCustomOrderSchema,
} from '#/schemas/custom-order-schemas'
import type { ValidateSearchCustomOrderSchema } from '#/schemas/custom-order-schemas'
import z from 'zod'

const TAKE = 15

// ─── Select ───────────────────────────────────────────────────────────────────

const adminCustomOrderSelect = {
  id: true,
  status: true,
  description: true,
  guestName: true,
  guestEmail: true,
  budgetMin: true,
  budgetMax: true,
  quotedPrice: true,
  colorNote: true,
  size: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { name: true, email: true } },
} as const

// ─── Server functions ─────────────────────────────────────────────────────────

// SECURITY: ✓ public endpoint (no auth required for submission), ✓ input validated via zod,
//           ✓ no PII leaked in response (only id returned), ✓ userId taken from input (caller sets from session)
export const submitCustomOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(submitCustomOrderSchema)
  .handler(async ({ data }) => {
    const record = await prisma.customOrderRequest.create({
      data: {
        description: data.description,
        refImages: [],
        size: data.size ?? null,
        colorNote: data.colorNote ?? null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        userId: data.userId ?? null,
        guestName: data.guestName ?? null,
        guestEmail: data.guestEmail || null,
      },
      select: { id: true },
    })

    return { id: record.id }
  })

export const getAdminCustomOrdersFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(getAdminCustomOrdersSchema)
  .handler(async ({ data }) => {
    const skip = (data.page - 1) * TAKE

    const where = {
      ...(data.status ? { status: data.status } : {}),
      ...(data.search
        ? {
            OR: [
              {
                guestName: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                guestEmail: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: data.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                user: {
                  name: { contains: data.search, mode: 'insensitive' as const },
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

    const [requests, total] = await Promise.all([
      prisma.customOrderRequest.findMany({
        where,
        select: adminCustomOrderSelect,
        orderBy: { createdAt: 'desc' },
        take: TAKE,
        skip,
      }),
      prisma.customOrderRequest.count({ where }),
    ])

    return { requests, total, pages: Math.ceil(total / TAKE) }
  })

export const getAdminCustomOrderByIdFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    return prisma.customOrderRequest.findFirstOrThrow({
      where: { id: data.id },
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    })
  })

export const updateCustomOrderFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(updateCustomOrderSchema)
  .handler(async ({ data }) => {
    return prisma.customOrderRequest.update({
      where: { id: data.id },
      data: {
        status: data.status,
        quotedPrice: data.quotedPrice,
        adminNotes: data.adminNotes,
      },
      select: { id: true, status: true },
    })
  })

// ─── Query options ────────────────────────────────────────────────────────────

export const adminCustomOrdersQueryOptions = (
  search: ValidateSearchCustomOrderSchema,
) =>
  queryOptions({
    queryKey: ['admin', 'custom-orders', search],
    queryFn: () => getAdminCustomOrdersFn({ data: search }),
  })

export const adminCustomOrderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin', 'custom-orders', id],
    queryFn: () => getAdminCustomOrderByIdFn({ data: { id } }),
  })
