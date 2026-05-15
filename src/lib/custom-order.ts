import type { CustomOrderStatusEnum } from '#/schemas/custom-order-schemas'

export const CUSTOM_STATUS_FILTERS: Array<{
  value: CustomOrderStatusEnum | undefined
  label: string
}> = [
  { value: undefined, label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export const CUSTOM_STATUS_LABEL: Record<CustomOrderStatusEnum, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  QUOTED: 'Quoted',
  ACCEPTED: 'Accepted',
  IN_PRODUCTION: 'In Production',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const CUSTOM_STATUS_STYLE: Record<CustomOrderStatusEnum, string> = {
  NEW: 'chip',
  UNDER_REVIEW: 'chip chip-gold',
  QUOTED: 'chip chip-sky',
  ACCEPTED: 'chip chip-ok',
  IN_PRODUCTION: 'chip bg-purple-100 text-purple-700 border-purple-300',
  COMPLETED: 'chip chip-ink',
  REJECTED: 'chip chip-err',
  CANCELLED: 'chip bg-neutral-100 text-neutral-500 border-neutral-300',
}

export const CUSTOM_STATUS_OPTIONS = CUSTOM_STATUS_FILTERS.filter(
  (f): f is { value: NonNullable<typeof f.value>; label: string } =>
    f.value !== undefined,
)
