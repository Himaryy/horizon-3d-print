import { prisma } from '#/db'
import {
  requireAdminFnMiddleware,
  requireUserFnMiddleware,
} from '#/middleware/auth'
import {
  createMyAddressSchema,
  deleteMyAddressSchema,
  getAllUsersSchema,
  setDefaultMyAddressSchema,
  updateMyAddressSchema,
  updateMyProfileSchema,
} from '#/schemas/user-schemas'
import { createServerFn } from '@tanstack/react-start'

// ADMIN

export const getAllUsersFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(getAllUsersSchema)
  .handler(async ({ data }) => {
    const take = 20 // default items per page
    const skip = (data.page - 1) * take // calculate how many items to skip based on the current page

    const where = data.search
      ? {
          OR: [
            { name: { contains: data.search, mode: 'insensitive' as const } },
            { email: { contains: data.search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Use Promise.all to execute both queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take,
        skip,
      }),

      prisma.user.count({ where }),
    ])

    return {
      users,
      total,
      pages: Math.ceil(total / take),
    }
  })

// GLOBAL
export const updateMyProfileFn = createServerFn({ method: 'POST' })
  .middleware([requireUserFnMiddleware])
  .inputValidator(updateMyProfileSchema)
  .handler(async ({ data, context }) => {
    return prisma.user.update({
      where: {
        id: context.user.id,
      },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })
  })

export const getMyAddressFn = createServerFn({ method: 'GET' })
  .middleware([requireUserFnMiddleware])
  .handler(async ({ context }) => {
    return prisma.userAddress.findMany({
      where: {
        userId: context.user.id,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        { createdAt: 'desc' },
      ],
    })
  })

export const createMyAddressFn = createServerFn({ method: 'POST' })
  .middleware([requireUserFnMiddleware])
  .inputValidator(createMyAddressSchema)
  .handler(async ({ data, context }) => {
    const userId = context.user.id

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        })
      }

      return tx.userAddress.create({
        data: { ...data, userId },
      })
    })
  })

export const updateMyAddressFn = createServerFn({ method: 'POST' })
  .middleware([requireUserFnMiddleware])
  .inputValidator(updateMyAddressSchema)
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data

    await prisma.userAddress.findFirstOrThrow({
      where: {
        id,
        userId: context.user.id,
      },
    })

    return prisma.userAddress.update({
      where: { id },
      data: rest,
    })
  })

export const deleteMyAddressFn = createServerFn({ method: 'POST' })
  .middleware([requireUserFnMiddleware])
  .inputValidator(deleteMyAddressSchema)
  .handler(async ({ context, data }) => {
    await prisma.userAddress.findFirstOrThrow({
      where: {
        id: data.id,
        userId: context.user.id,
      },
    })

    return prisma.userAddress.delete({
      where: { id: data.id },
    })
  })

export const setDefaultMyAddressFn = createServerFn({ method: 'POST' })
  .middleware([requireUserFnMiddleware])
  .inputValidator(setDefaultMyAddressSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    await prisma.userAddress.findFirstOrThrow({
      where: {
        id: data.id,
        userId,
      },
    })

    return prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId },
        data: {
          isDefault: false,
        },
      })

      return tx.userAddress.update({
        where: { id: data.id },
        data: { isDefault: true },
      })
    })
  })
