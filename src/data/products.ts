import { prisma } from '#/db'
import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

// ─── Selects ──────────────────────────────────────────────────────────────────

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  category: true,
  images: {
    select: { url: true, alt: true },
    orderBy: { order: 'asc' as const },
    take: 1,
  },
} as const

// ─── Server functions ─────────────────────────────────────────────────────────

export const getFeaturedProductsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isPublished: true, deletedAt: null },
      select: productCardSelect,
    })

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.images[0]?.url,
    }))
  },
)

const getPublishedProductsInput = z.object({
  search: z.string().optional(),
  category: z.enum(['READY_MADE', 'CUSTOM_BASE']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
})

export type PublishedProductsInput = z.infer<typeof getPublishedProductsInput>

export const getPublishedProductsFn = createServerFn({ method: 'GET' })
  .inputValidator(getPublishedProductsInput)
  .handler(async ({ data }) => {
    const orderBy =
      data.sort === 'price_asc'
        ? { price: 'asc' as const }
        : data.sort === 'price_desc'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const }

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        ...(data.category ? { category: data.category } : {}),
        ...(data.search
          ? { name: { contains: data.search, mode: 'insensitive' } }
          : {}),
      },
      select: productCardSelect,
      orderBy,
    })

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.images[0]?.url,
    }))
  })

export const getProductBySlugFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    return prisma.product.findFirstOrThrow({
      where: { slug: data.slug, isPublished: true, deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        desc: true,
        price: true,
        stock: true,
        category: true,
        isPublished: true,
        isFeatured: true,
        modelUrl: true,
        videoUrl: true,
        images: {
          select: { id: true, url: true, alt: true, order: true },
          orderBy: { order: 'asc' },
        },
        variants: {
          select: {
            id: true,
            color: true,
            size: true,
            priceAdjust: true,
            stock: true,
            sku: true,
          },
        },
      },
    })
  })

export const getProductReviewsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ productId: z.string() }))
  .handler(async ({ data }) => {
    return prisma.review.findMany({
      where: { productId: data.productId, isVisible: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

export const getFeaturedReviewsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.review.findMany({
      where: { isVisible: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
  },
)

// ─── Query options ────────────────────────────────────────────────────────────

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryKey: ['products', 'featured'],
    queryFn: () => getFeaturedProductsFn(),
  })

export const publishedProductsQueryOptions = (input: PublishedProductsInput) =>
  queryOptions({
    queryKey: ['products', 'published', input],
    queryFn: () => getPublishedProductsFn({ data: input }),
  })

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ['products', 'slug', slug],
    queryFn: () => getProductBySlugFn({ data: { slug } }),
  })

export const productReviewsQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: ['products', 'reviews', productId],
    queryFn: () => getProductReviewsFn({ data: { productId } }),
  })

export const featuredReviewsQueryOptions = () =>
  queryOptions({
    queryKey: ['reviews', 'featured'],
    queryFn: () => getFeaturedReviewsFn(),
  })
