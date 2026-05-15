import z from 'zod'

export const getAdminCustomersSchema = z.object({
  page: z.number().min(1).default(1),
  search: z.string().optional(),
})

export const validateSearchCustomerSchema = z.object({
  page: z.number().catch(1),
  search: z.string().optional(),
})

export type ValidateSearchCustomerSchema = z.infer<
  typeof validateSearchCustomerSchema
>
