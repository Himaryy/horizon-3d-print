import z from 'zod'

export const getAllUsersSchema = z.object({
  page: z.number().min(1).default(1),
  search: z.string().optional(),
})

export const updateMyProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.url().optional(),
})

export const createMyAddressSchema = z.object({
  label: z.string().min(1, { message: 'Label is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  phone: z.string().min(1, { message: 'Phone is required' }),
  street: z.string().min(1, { message: 'Street is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  province: z.string().min(1, { message: 'Province is required' }),
  postal: z.string().min(1, { message: 'Postal code is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  isDefault: z.boolean().default(false),
})

export const updateMyAddressSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  street: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  postal: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
})

export const deleteMyAddressSchema = z.object({
  id: z.string().min(1),
})

export const setDefaultMyAddressSchema = z.object({
  id: z.string().min(1),
})
