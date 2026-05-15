import z from 'zod'

export const customOrderStatusEnum = z.enum([
  'NEW',
  'UNDER_REVIEW',
  'QUOTED',
  'ACCEPTED',
  'IN_PRODUCTION',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
])

export type CustomOrderStatusEnum = z.infer<typeof customOrderStatusEnum>

// ─── Submit (public) ──────────────────────────────────────────────────────────

export const submitCustomOrderSchema = z.object({
  description: z.string().min(10, 'Please describe your design (min 10 chars)'),
  size: z.string().optional(),
  colorNote: z.string().optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  userId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.union([z.literal(''), z.email()]).optional(),
})

export type SubmitCustomOrderSchema = z.infer<typeof submitCustomOrderSchema>

// ─── Admin list ───────────────────────────────────────────────────────────────

export const getAdminCustomOrdersSchema = z.object({
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  status: customOrderStatusEnum.optional(),
})

export type GetAdminCustomOrdersSchema = z.infer<
  typeof getAdminCustomOrdersSchema
>

// ─── Route validateSearch ─────────────────────────────────────────────────────

export const validateSearchCustomOrderSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
  status: customOrderStatusEnum.optional(),
})

export type ValidateSearchCustomOrderSchema = z.infer<
  typeof validateSearchCustomOrderSchema
>

// ─── Update (admin) ───────────────────────────────────────────────────────────

export const updateCustomOrderSchema = z.object({
  id: z.string().min(1),
  status: customOrderStatusEnum,
  quotedPrice: z.number().int().min(0).nullable(),
  adminNotes: z.string().nullable(),
})

export type UpdateCustomOrderSchema = z.infer<typeof updateCustomOrderSchema>
