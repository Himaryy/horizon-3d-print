import { prisma } from '#/db'

const products = [
  {
    slug: 'articulated-dragon',
    name: 'Articulated Dragon',
    desc: 'Fully articulated dragon with movable joints, printed in a single piece. No assembly required. A showpiece that actually moves.',
    price: 185000,
    stock: 12,
    category: 'READY_MADE' as const,
    isPublished: true,
    isFeatured: true,
    images: [
      {
        url: 'https://placehold.co/800x800/16110A/FFC23C?text=Dragon',
        alt: 'Articulated Dragon front view',
        order: 0,
      },
      {
        url: 'https://placehold.co/800x800/16110A/FFC23C?text=Dragon+Side',
        alt: 'Articulated Dragon side view',
        order: 1,
      },
    ],
    variants: [
      {
        color: 'Midnight Black',
        size: null,
        priceAdjust: 0,
        stock: 4,
        sku: 'DRG-BLK',
      },
      {
        color: 'Warm White',
        size: null,
        priceAdjust: 0,
        stock: 3,
        sku: 'DRG-WHT',
      },
      {
        color: 'Sky Blue',
        size: null,
        priceAdjust: 0,
        stock: 3,
        sku: 'DRG-SKY',
      },
      {
        color: 'Gold',
        size: null,
        priceAdjust: 15000,
        stock: 2,
        sku: 'DRG-GLD',
      },
    ],
  },
  {
    slug: 'phone-tablet-stand',
    name: 'Phone & Tablet Stand',
    desc: 'Adjustable desktop stand compatible with phones and tablets up to 12". Non-slip base, cable routing slot included.',
    price: 75000,
    stock: 30,
    category: 'READY_MADE' as const,
    isPublished: true,
    isFeatured: false,
    images: [
      {
        url: 'https://placehold.co/800x800/5BB8FF/16110A?text=Stand',
        alt: 'Phone stand front',
        order: 0,
      },
    ],
    variants: [
      {
        color: 'Midnight Black',
        size: null,
        priceAdjust: 0,
        stock: 15,
        sku: 'STD-BLK',
      },
      {
        color: 'Warm White',
        size: null,
        priceAdjust: 0,
        stock: 10,
        sku: 'STD-WHT',
      },
      {
        color: 'Stone Grey',
        size: null,
        priceAdjust: 0,
        stock: 5,
        sku: 'STD-GRY',
      },
    ],
  },
  {
    slug: 'modular-cable-organizer',
    name: 'Modular Cable Organizer',
    desc: 'Snap-together cable management clips for desk or wall. Set of 6 pieces in assorted sizes. Adhesive-mount or screw-mount compatible.',
    price: 55000,
    stock: 50,
    category: 'READY_MADE' as const,
    isPublished: true,
    isFeatured: false,
    images: [
      {
        url: 'https://placehold.co/800x800/9B8E76/FFFDF7?text=Organizer',
        alt: 'Cable organizer set',
        order: 0,
      },
    ],
    variants: [],
  },
  {
    slug: 'skull-planter-pot',
    name: 'Skull Planter Pot',
    desc: 'Gothic skull-shaped planter with drainage hole. Perfect for succulents and small cacti. Printed in plant-safe PETG.',
    price: 120000,
    stock: 20,
    category: 'READY_MADE' as const,
    isPublished: true,
    isFeatured: true,
    images: [
      {
        url: 'https://placehold.co/800x800/2D6A4F/FFFDF7?text=Skull+Pot',
        alt: 'Skull planter pot',
        order: 0,
      },
      {
        url: 'https://placehold.co/800x800/2D6A4F/FFFDF7?text=Skull+Top',
        alt: 'Skull planter top view',
        order: 1,
      },
    ],
    variants: [
      {
        color: 'Midnight Black',
        size: 'Small',
        priceAdjust: 0,
        stock: 5,
        sku: 'SKL-BLK-S',
      },
      {
        color: 'Midnight Black',
        size: 'Large',
        priceAdjust: 35000,
        stock: 3,
        sku: 'SKL-BLK-L',
      },
      {
        color: 'Forest Green',
        size: 'Small',
        priceAdjust: 0,
        stock: 5,
        sku: 'SKL-GRN-S',
      },
      {
        color: 'Forest Green',
        size: 'Large',
        priceAdjust: 35000,
        stock: 3,
        sku: 'SKL-GRN-L',
      },
      {
        color: 'Brick Red',
        size: 'Small',
        priceAdjust: 0,
        stock: 4,
        sku: 'SKL-RED-S',
      },
    ],
  },
  {
    slug: 'hex-wall-shelf-set',
    name: 'Hex Wall Shelf Set',
    desc: 'Set of 3 interlocking hexagonal wall shelves. Load-tested to 2kg per shelf. Includes wall anchors and template for perfect alignment.',
    price: 210000,
    stock: 15,
    category: 'READY_MADE' as const,
    isPublished: true,
    isFeatured: false,
    images: [
      {
        url: 'https://placehold.co/800x800/1B2A4A/5BB8FF?text=Hex+Shelf',
        alt: 'Hex wall shelf set',
        order: 0,
      },
    ],
    variants: [
      {
        color: 'Midnight Black',
        size: null,
        priceAdjust: 0,
        stock: 6,
        sku: 'HEX-BLK',
      },
      {
        color: 'Warm White',
        size: null,
        priceAdjust: 0,
        stock: 5,
        sku: 'HEX-WHT',
      },
      { color: 'Navy', size: null, priceAdjust: 0, stock: 4, sku: 'HEX-NVY' },
    ],
  },
  {
    slug: 'custom-name-keychain',
    name: 'Custom Name Keychain',
    desc: 'Personalized keychain with your name or short text (up to 12 characters). Choose font and color. Ships in 3–5 days.',
    price: 45000,
    stock: 999,
    category: 'CUSTOM_BASE' as const,
    isPublished: true,
    isFeatured: false,
    images: [
      {
        url: 'https://placehold.co/800x800/FFC23C/16110A?text=Keychain',
        alt: 'Custom name keychain',
        order: 0,
      },
    ],
    variants: [],
  },
  {
    slug: 'custom-miniature-figurine',
    name: 'Custom Miniature Figurine',
    desc: 'Fully custom 3D-printed figurine based on your reference image or 3D file. Choose size (10–25cm), color, and finish. Quote provided before production.',
    price: 350000,
    stock: 999,
    category: 'CUSTOM_BASE' as const,
    isPublished: true,
    isFeatured: true,
    images: [
      {
        url: 'https://placehold.co/800x800/FF6B6B/FFFDF7?text=Figurine',
        alt: 'Custom miniature figurine',
        order: 0,
      },
    ],
    variants: [
      {
        color: null,
        size: '10cm',
        priceAdjust: 0,
        stock: 999,
        sku: 'FIG-10CM',
      },
      {
        color: null,
        size: '15cm',
        priceAdjust: 100000,
        stock: 999,
        sku: 'FIG-15CM',
      },
      {
        color: null,
        size: '20cm',
        priceAdjust: 200000,
        stock: 999,
        sku: 'FIG-20CM',
      },
      {
        color: null,
        size: '25cm',
        priceAdjust: 350000,
        stock: 999,
        sku: 'FIG-25CM',
      },
    ],
  },
]

export async function seedProducts() {
  for (const p of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
    })
    if (existing) {
      console.log(`  ⚠️  Product "${p.name}" already exists, skipping.`)
      continue
    }

    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        desc: p.desc,
        price: p.price,
        stock: p.stock,
        category: p.category,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        images: { create: p.images },
        variants: { create: p.variants },
      },
    })

    console.log(`  ✅ Product: ${p.name}`)
  }
}
