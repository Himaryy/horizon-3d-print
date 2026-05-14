import z from 'zod'

const categoryEnum = z.enum(['READY_MADE', 'CUSTOM_BASE'])
const optionalUrl = z.union([z.literal(''), z.url()])

export const getAdminProductsSchema = z.object({
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  category: categoryEnum.optional(),
})

const productBaseSchema = z.object({
  slug: z.string().min(1, { message: 'Slug is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  desc: z.string().min(1, { message: 'Description is required' }),

  price: z.number().int().min(0),
  stock: z.number().int().min(0),

  category: categoryEnum,

  isPublished: z.boolean(),
  isFeatured: z.boolean(),

  modelUrl: optionalUrl,
  videoUrl: optionalUrl,
  tokopediaUrl: optionalUrl,
  shopeeUrl: optionalUrl,
})

export const createProductSchema = productBaseSchema
export type CreateProductSchema = z.infer<typeof createProductSchema>

export const updateProductSchema = productBaseSchema.extend({
  id: z.string().min(1),
})

export const productIdSchema = z.object({
  id: z.string().min(1),
})

export const validateSearchProductSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
  category: categoryEnum.optional(),
})

export type ValidateSearchProductSchema = z.infer<
  typeof validateSearchProductSchema
>
