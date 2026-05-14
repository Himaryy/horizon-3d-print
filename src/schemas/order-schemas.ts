import z from 'zod'

export const orderStatusEnum = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'PRINTING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

export const orderSourceEnum = z.enum(['WEBSITE', 'TOKOPEDIA', 'SHOPEE'])

export type OrderStatusEnum = z.infer<typeof orderStatusEnum>
export type OrderSourceEnum = z.infer<typeof orderSourceEnum>

export const getAdminOrdersSchema = z.object({
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  status: orderStatusEnum.optional(),
  source: orderSourceEnum.optional(),
})

export const validateSearchOrderSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
  status: orderStatusEnum.optional(),
  source: orderSourceEnum.optional(),
})

export type ValidateSearchOrderSchema = z.infer<
  typeof validateSearchOrderSchema
>

const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
})

export const createManualOrderSchema = z.object({
  source: orderSourceEnum,
  externalOrderId: z.string(),
  customerName: z.string().min(1, 'Customer name required'),
  customerEmail: z.union([z.literal(''), z.email()]),
  status: orderStatusEnum,
  shippingCost: z.number().int().min(0),
  shippingAddress: z.object({
    name: z.string().min(1, 'Recipient name required'),
    phone: z.string().min(1, 'Phone required'),
    street: z.string().min(1, 'Street required'),
    city: z.string().min(1, 'City required'),
    province: z.string().min(1, 'Province required'),
    postal: z.string().min(1, 'Postal code required'),
  }),
  notes: z.string(),
  items: z.array(orderItemInputSchema).min(1, 'At least one item required'),
})

export type CreateManualOrderSchema = z.infer<typeof createManualOrderSchema>

export const updateOrderStatusSchema = z.object({
  id: z.string().min(1),
  status: orderStatusEnum,
  courier: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string(),
  adminNotes: z.string(),
})

export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>

export const orderIdSchema = z.object({
  id: z.string().min(1),
})
