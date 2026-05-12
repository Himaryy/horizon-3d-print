import type { User } from 'better-auth'

// ─── Navigation ────────────────────────────────────────────────────────────

export interface NavItem {
  to: string
  label: string
}

export interface NavbarUserProps {
  user: User
}

// ─── Product ───────────────────────────────────────────────────────────────

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  category: string
  image?: string
}

export interface ProductColor {
  name: string
  hex: string
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductDetail extends Product {
  description?: string
  images?: string[]
  material?: string
  stock?: number
  colors?: ProductColor[]
  specs?: ProductSpec[]
}

// ─── Cart ──────────────────────────────────────────────────────────────────

export interface CartItemType {
  id: string
  slug: string
  name: string
  price: number
  category: string
  image?: string
  material: string
  color?: string
  qty: number
}

// ─── Material ──────────────────────────────────────────────────────────────

export interface Material {
  name: string
  tagline: string
  swatch: string
  tier: string
  properties: string[]
  best: string
}

// ─── Review ────────────────────────────────────────────────────────────────

export interface Review {
  name: string
  label: string
  avatar: string
  stars: number
  text: string
  featured?: boolean
}
