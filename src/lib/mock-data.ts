import type { ProductDetail } from './types'

export const MOCK_PRODUCTS = [
  {
    id: '1',
    slug: 'articulated-dragon',
    name: 'Articulated Dragon',
    price: 185000,
    category: 'Figurines',
  },
  {
    id: '2',
    slug: 'cable-organizer',
    name: 'Desk Cable Organizer',
    price: 45000,
    category: 'Utility',
  },
  {
    id: '3',
    slug: 'phone-stand',
    name: 'Adjustable Phone Stand',
    price: 65000,
    category: 'Utility',
  },
  {
    id: '4',
    slug: 'flexi-snake',
    name: 'Flexi Snake Toy',
    price: 120000,
    category: 'Figurines',
  },
  {
    id: '5',
    slug: 'planter-pot',
    name: 'Geometric Planter Pot',
    price: 95000,
    category: 'Home',
  },
  {
    id: '6',
    slug: 'wall-hook',
    name: 'Modular Wall Hook',
    price: 38000,
    category: 'Home',
  },
]

export const MATERIALS = [
  {
    name: 'PLA',
    tagline: 'The crowd-pleaser',
    swatch: '#5BB8FF',
    tier: 'Budget',
    properties: ['Biodegradable', 'Vivid colors', 'Easy print'],
    best: 'Toys · Figurines · Decor',
  },
  {
    name: 'PETG',
    tagline: 'Tough & clear',
    swatch: '#A9DAFF',
    tier: 'Mid range',
    properties: ['Food-safe', 'Humidity resistant', 'Layer strong'],
    best: 'Utility · Containers · Clips',
  },
  {
    name: 'TPU',
    tagline: 'Born flexible',
    swatch: '#FFC23C',
    tier: 'Mid range',
    properties: ['Rubber-like', 'Impact absorb', 'Squishable'],
    best: 'Hinges · Grips · Wearables',
  },
  {
    name: 'ABS',
    tagline: 'The workhorse',
    swatch: '#9B8E76',
    tier: 'Mid range',
    properties: ['Heat resistant', 'Sandable', 'Machinable'],
    best: 'Automotive · Tools · Cases',
  },
  {
    name: 'Resin',
    tagline: 'Ultra-detailed',
    swatch: '#7AC4FF',
    tier: 'Premium',
    properties: ['0.01mm detail', 'Smooth surface', 'Display quality'],
    best: 'Miniatures · Jewelry · Art',
  },
  {
    name: 'CF Nylon',
    tagline: 'Industrial grade',
    swatch: '#16110A',
    tier: 'Premium',
    properties: ['Carbon fiber', 'Lightweight', 'Load-bearing'],
    best: 'Engineering · Drones · Brackets',
  },
]

export const FEATURED = [
  {
    id: '1',
    slug: 'articulated-dragon',
    name: 'Articulated Dragon',
    price: 185000,
    category: 'Figurines',
  },
  {
    id: '2',
    slug: 'flexi-snake',
    name: 'Flexi Snake Toy',
    price: 120000,
    category: 'Figurines',
  },
  {
    id: '3',
    slug: 'cable-organizer',
    name: 'Desk Cable Organizer',
    price: 45000,
    category: 'Utility',
  },
  {
    id: '4',
    slug: 'geometric-planter',
    name: 'Geometric Planter Pot',
    price: 95000,
    category: 'Home',
  },
]

export const MINI_REVIEWS = [
  {
    name: 'Rizky A.',
    label: 'Collector · Jakarta',
    avatar: '#5BB8FF',
    stars: 5,
    text: 'Dragon arrived next day. Joints move perfectly out of the box. Detail is insane for the price.',
  },
  {
    name: 'Sinta W.',
    label: 'Gift buyer · Bandung',
    avatar: '#FFC23C',
    stars: 5,
    text: "Bought the flexi snake for my son's birthday. He lost his mind. Packaging felt premium.",
  },
  {
    name: 'Daffa M.',
    label: 'Maker · Surabaya',
    avatar: '#9B8E76',
    stars: 5,
    text: 'Uploaded a custom bracket STL. Quoted in under a minute, CF Nylon arrived in 24h. Spot on.',
  },
]

export const ALL_REVIEWS = [
  {
    name: 'Dimas Kurniawan',
    label: 'Operations · Kopi Tubruk Co.',
    avatar: '#FFC23C',
    stars: 5,
    text: 'We replaced 4 broken parts on our espresso machines in 18 hours. Faster than OEM and half the price. Horizon is our quiet manufacturing partner.',
    featured: true,
  },
  {
    name: 'Rizky A.',
    label: 'Collector · Jakarta',
    avatar: '#5BB8FF',
    stars: 5,
    text: 'Dragon arrived next day. Joints move perfectly out of the box. Detail is insane for the price.',
    featured: false,
  },
  {
    name: 'Sinta W.',
    label: 'Gift buyer · Bandung',
    avatar: '#FFC23C',
    stars: 5,
    text: "Bought the flexi snake for my son's birthday. He lost his mind. Packaging felt premium.",
    featured: false,
  },
  {
    name: 'Daffa M.',
    label: 'Maker · Surabaya',
    avatar: '#9B8E76',
    stars: 5,
    text: 'Uploaded a custom bracket STL. Quoted in under a minute, CF Nylon arrived in 24h. Spot on.',
    featured: false,
  },
  {
    name: 'Ayu R.',
    label: 'Small business · Yogyakarta',
    avatar: '#5BB8FF',
    stars: 5,
    text: 'Ordered 30 custom keychains for our event. Consistent quality across every single piece. Will reorder.',
    featured: false,
  },
  {
    name: 'Bagas P.',
    label: 'Engineer · Bekasi',
    avatar: '#16110A',
    stars: 5,
    text: 'CF Nylon bracket holds 8kg no problem. Tolerances were tighter than I expected. Impressed.',
    featured: false,
  },
  {
    name: 'Nadia F.',
    label: 'Artist · Bali',
    avatar: '#7AC4FF',
    stars: 5,
    text: 'Resin prints for my jewelry molds came out perfect. Surface is smooth straight off the printer.',
    featured: false,
  },
  {
    name: 'Hendra T.',
    label: 'Prototype lab · Semarang',
    avatar: '#FFC23C',
    stars: 5,
    text: 'Three design iterations in one week. Fast turnaround is a serious competitive advantage for us.',
    featured: false,
  },
]

export const MOCK_DETAIL: ProductDetail = {
  id: '1',
  slug: 'articulated-dragon',
  name: 'Articulated Dragon',
  price: 185000,
  category: 'Figurines',
  description:
    'Every joint moves. Printed in one piece — no assembly. PLA, 0.1mm layer height, 35% infill. Ships within 24 hours.',
  material: 'PLA',
  stock: 12,
  images: [],
  colors: [
    { name: 'Midnight Black', hex: '#16110A' },
    { name: 'Sky Blue', hex: '#5BB8FF' },
    { name: 'Gold', hex: '#FFC23C' },
    { name: 'Warm White', hex: '#FFFDF7' },
    { name: 'Stone', hex: '#9B8E76' },
  ],
  specs: [
    { label: 'Layer Height', value: '0.1mm' },
    { label: 'Infill', value: '35%' },
    { label: 'Material', value: 'PLA' },
    { label: 'Dimensions', value: '22 × 18 × 12 cm' },
    { label: 'Weight', value: '~85g' },
    { label: 'Print Time', value: '~14 hours' },
    { label: 'Joints', value: '34 articulated segments' },
  ],
}
