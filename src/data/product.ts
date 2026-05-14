import { prisma } from '#/db'
import { requireAdminFnMiddleware } from '#/middleware/auth'
import {
  createProductSchema,
  getAdminProductsSchema,
  productIdSchema,
  updateProductSchema,
} from '#/schemas/product-schemas'
import type { ValidateSearchProductSchema } from '#/schemas/product-schemas'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

const TAKE_DATA = 20

const adminProductSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  stock: true,
  category: true,
  isPublished: true,
  isFeatured: true,
  deletedAt: true,
  createdAt: true,
  images: {
    select: { url: true, alt: true, order: true },
    orderBy: { order: 'asc' as const },
    take: 1,
  },
} as const

export const getAdminProductsFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(getAdminProductsSchema)
  .handler(async ({ data }) => {
    const skip = (data.page - 1) * TAKE_DATA

    const where = {
      deletedAt: null,
      ...(data.category ? { category: data.category } : {}),
      ...(data.search
        ? {
            OR: [
              {
                name: { contains: data.search, mode: 'insensitive' as const },
              },
              { slug: { contains: data.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: adminProductSelect,
        orderBy: {
          createdAt: 'desc',
        },
        take: TAKE_DATA,
        skip,
      }),
      prisma.product.count({ where }),
    ])

    return { products, total, pages: Math.ceil(total / TAKE_DATA) }
  })

export const getAdminProductByIdFn = createServerFn({ method: 'GET' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(productIdSchema)
  .handler(async ({ data }) => {
    return prisma.product.findFirstOrThrow({
      where: {
        id: data.id,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        variants: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })
  })

export const createProductFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(createProductSchema)
  .handler(async ({ data }) => {
    return prisma.product.create({
      data: {
        ...data,
        modelUrl: data.modelUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        tokopediaUrl: data.tokopediaUrl || undefined,
        shopeeUrl: data.shopeeUrl || undefined,
      },
      select: {
        id: true,
        slug: true,
      },
    })
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(updateProductSchema)
  .handler(async ({ data }) => {
    const { id, ...rest } = data

    return prisma.product.update({
      where: { id },
      data: {
        ...rest,
        modelUrl: rest.modelUrl || undefined,
        videoUrl: rest.videoUrl || undefined,
        tokopediaUrl: rest.tokopediaUrl || undefined,
        shopeeUrl: rest.shopeeUrl || undefined,
      },
      select: {
        id: true,
        slug: true,
      },
    })
  })

export const togglePublishFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(productIdSchema)
  .handler(async ({ data }) => {
    const product = await prisma.product.findFirstOrThrow({
      where: {
        id: data.id,
        deletedAt: null,
      },
      select: {
        isPublished: true,
      },
    })

    return prisma.product.update({
      where: { id: data.id },
      data: {
        isPublished: !product.isPublished,
      },
      select: {
        id: true,
        isPublished: true,
      },
    })
  })

export const toggleFeaturedFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(productIdSchema)
  .handler(async ({ data }) => {
    const product = await prisma.product.findFirstOrThrow({
      where: {
        id: data.id,
        deletedAt: null,
      },
      select: { isFeatured: true },
    })

    return prisma.product.update({
      where: { id: data.id },
      data: { isFeatured: !product.isFeatured },
      select: {
        id: true,
        isFeatured: true,
      },
    })
  })

export const softDeleteProductFn = createServerFn({ method: 'POST' })
  .middleware([requireAdminFnMiddleware])
  .inputValidator(productIdSchema)
  .handler(async ({ data }) => {
    return prisma.product.update({
      where: { id: data.id },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  })

type AdminProductSearch = ValidateSearchProductSchema

export const adminProductQueryOptions = (search: AdminProductSearch) =>
  queryOptions({
    queryKey: ['admin', 'products', search],
    queryFn: () =>
      getAdminProductsFn({
        data: search,
      }),
  })
