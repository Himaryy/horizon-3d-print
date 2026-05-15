import { prisma } from '#/db'
import { randomUUID } from 'node:crypto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function invoiceNumber(yyyymm: string, seq: number) {
  return `INV-${yyyymm}-${String(seq).padStart(4, '0')}`
}

function shippingAddress(
  name: string,
  phone: string,
  street: string,
  city: string,
  province: string,
  postal: string,
) {
  return { name, phone, street, city, province, postal, country: 'Indonesia' }
}

// ─── Customer data ────────────────────────────────────────────────────────────

const customers = [
  {
    id: `seed_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    role: 'user',
    emailVerified: true,
    addresses: [
      {
        label: 'Rumah',
        isDefault: true,
        name: 'Budi Santoso',
        phone: '081234567890',
        street: 'Jl. Mawar No. 12',
        city: 'Bandung',
        province: 'Jawa Barat',
        postal: '40132',
      },
    ],
  },
  {
    id: `seed_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    name: 'Siti Rahayu',
    email: 'siti.rahayu@yahoo.com',
    role: 'user',
    emailVerified: true,
    addresses: [
      {
        label: 'Kantor',
        isDefault: false,
        name: 'Siti Rahayu',
        phone: '082345678901',
        street: 'Jl. Sudirman No. 88, Lt. 5',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postal: '10220',
      },
      {
        label: 'Rumah',
        isDefault: true,
        name: 'Siti Rahayu',
        phone: '082345678901',
        street: 'Jl. Kenanga Indah Blok C3 No. 7',
        city: 'Depok',
        province: 'Jawa Barat',
        postal: '16415',
      },
    ],
  },
  {
    id: `seed_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    name: 'Ahmad Fauzi',
    email: 'ahmadfauzi93@gmail.com',
    role: 'user',
    emailVerified: false,
    addresses: [
      {
        label: 'Rumah',
        isDefault: true,
        name: 'Ahmad Fauzi',
        phone: '085678901234',
        street: 'Perum Griya Asri Blok B No. 14',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postal: '60111',
      },
    ],
  },
  {
    id: `seed_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    name: 'Maria Dewi',
    email: 'maria.dewi.id@gmail.com',
    role: 'user',
    emailVerified: true,
    addresses: [
      {
        label: 'Rumah',
        isDefault: true,
        name: 'Maria Dewi',
        phone: '087890123456',
        street: 'Jl. Diponegoro No. 45',
        city: 'Yogyakarta',
        province: 'DI Yogyakarta',
        postal: '55231',
      },
    ],
  },
]

export async function seedCustomers() {
  // Fetch products needed for orders
  const dragon = await prisma.product.findUnique({
    where: { slug: 'articulated-dragon' },
  })
  const stand = await prisma.product.findUnique({
    where: { slug: 'phone-tablet-stand' },
  })
  const organizer = await prisma.product.findUnique({
    where: { slug: 'modular-cable-organizer' },
  })
  const planter = await prisma.product.findUnique({
    where: { slug: 'skull-planter-pot' },
  })
  const hexShelf = await prisma.product.findUnique({
    where: { slug: 'hex-wall-shelf-set' },
  })

  if (!dragon || !stand || !organizer || !planter || !hexShelf) {
    console.log('  ⚠️  Products not found — run seed-products first.')
    return
  }

  // Upsert users
  const userMap: Record<string, string> = {}
  for (const c of customers) {
    const existing = await prisma.user.findUnique({ where: { email: c.email } })
    if (existing) {
      console.log(`  ⚠️  Customer "${c.name}" already exists, skipping.`)
      userMap[c.email] = existing.id
      continue
    }

    const user = await prisma.user.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        emailVerified: c.emailVerified,
        addresses: { create: c.addresses },
      },
    })
    userMap[c.email] = user.id
    console.log(`  ✅ Customer: ${c.name}`)
  }

  const budiId = userMap['budi.santoso@gmail.com']
  const sitiId = userMap['siti.rahayu@yahoo.com']
  const ahmadId = userMap['ahmadfauzi93@gmail.com']
  const mariaId = userMap['maria.dewi.id@gmail.com']

  // ─── Orders ────────────────────────────────────────────────────────────────

  const existingOrders = await prisma.order.count({
    where: { invoiceNumber: { startsWith: 'INV-202501' } },
  })
  if (existingOrders > 0) {
    console.log('  ⚠️  Seed orders already exist, skipping orders.')
    return
  }

  // Budi — Order 1: Dragon + Stand (DELIVERED)
  const dragonVariant = await prisma.productVariant.findFirst({
    where: { productId: dragon.id, color: 'Midnight Black' },
  })
  const standVariant = await prisma.productVariant.findFirst({
    where: { productId: stand.id, color: 'Midnight Black' },
  })

  const budiOrder1 = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202501', 1),
      source: 'WEBSITE',
      userId: budiId,
      status: 'DELIVERED',
      subtotal: dragon.price + stand.price,
      shippingCost: 25000,
      total: dragon.price + stand.price + 25000,
      shippingAddress: shippingAddress(
        'Budi Santoso',
        '081234567890',
        'Jl. Mawar No. 12',
        'Bandung',
        'Jawa Barat',
        '40132',
      ),
      paidAt: new Date('2025-01-10T08:30:00Z'),
      items: {
        create: [
          {
            productId: dragon.id,
            variantId: dragonVariant?.id ?? null,
            qty: 1,
            unitPrice: dragon.price,
            total: dragon.price,
            productSnapshot: {
              name: dragon.name,
              price: dragon.price,
              color: 'Midnight Black',
            },
          },
          {
            productId: stand.id,
            variantId: standVariant?.id ?? null,
            qty: 1,
            unitPrice: stand.price,
            total: stand.price,
            productSnapshot: {
              name: stand.name,
              price: stand.price,
              color: 'Midnight Black',
            },
          },
        ],
      },
    },
  })

  // Budi — Order 2: Cable Organizer x2 (SHIPPED)
  const budiOrder2 = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202502', 1),
      source: 'WEBSITE',
      userId: budiId,
      status: 'SHIPPED',
      subtotal: organizer.price * 2,
      shippingCost: 15000,
      total: organizer.price * 2 + 15000,
      shippingAddress: shippingAddress(
        'Budi Santoso',
        '081234567890',
        'Jl. Mawar No. 12',
        'Bandung',
        'Jawa Barat',
        '40132',
      ),
      paidAt: new Date('2025-02-03T10:00:00Z'),
      trackingNumber: 'JNE-2025-7891234',
      courier: 'JNE',
      items: {
        create: [
          {
            productId: organizer.id,
            variantId: null,
            qty: 2,
            unitPrice: organizer.price,
            total: organizer.price * 2,
            productSnapshot: { name: organizer.name, price: organizer.price },
          },
        ],
      },
    },
  })

  console.log(
    `  ✅ Budi orders: ${budiOrder1.invoiceNumber}, ${budiOrder2.invoiceNumber}`,
  )

  // Siti — Order: Hex Shelf + Planter (PAID)
  const hexVariant = await prisma.productVariant.findFirst({
    where: { productId: hexShelf.id, color: 'Warm White' },
  })
  const planterVariant = await prisma.productVariant.findFirst({
    where: { productId: planter.id, color: 'Forest Green', size: 'Small' },
  })

  const sitiOrder = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202502', 2),
      source: 'WEBSITE',
      userId: sitiId,
      status: 'PAID',
      subtotal: hexShelf.price + planter.price,
      shippingCost: 30000,
      total: hexShelf.price + planter.price + 30000,
      shippingAddress: shippingAddress(
        'Siti Rahayu',
        '082345678901',
        'Jl. Kenanga Indah Blok C3 No. 7',
        'Depok',
        'Jawa Barat',
        '16415',
      ),
      paidAt: new Date('2025-02-14T15:20:00Z'),
      items: {
        create: [
          {
            productId: hexShelf.id,
            variantId: hexVariant?.id ?? null,
            qty: 1,
            unitPrice: hexShelf.price,
            total: hexShelf.price,
            productSnapshot: {
              name: hexShelf.name,
              price: hexShelf.price,
              color: 'Warm White',
            },
          },
          {
            productId: planter.id,
            variantId: planterVariant?.id ?? null,
            qty: 1,
            unitPrice: planter.price,
            total: planter.price,
            productSnapshot: {
              name: planter.name,
              price: planter.price,
              color: 'Forest Green',
              size: 'Small',
            },
          },
        ],
      },
    },
  })

  console.log(`  ✅ Siti order: ${sitiOrder.invoiceNumber}`)

  // Ahmad — Order from Tokopedia (PROCESSING)
  const ahmadOrder = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202502', 3),
      source: 'TOKOPEDIA',
      externalOrderId: 'TKP-88571234-2025',
      userId: ahmadId,
      status: 'PROCESSING',
      subtotal: dragon.price,
      shippingCost: 20000,
      total: dragon.price + 20000,
      shippingAddress: shippingAddress(
        'Ahmad Fauzi',
        '085678901234',
        'Perum Griya Asri Blok B No. 14',
        'Surabaya',
        'Jawa Timur',
        '60111',
      ),
      paidAt: new Date('2025-02-20T09:00:00Z'),
      items: {
        create: [
          {
            productId: dragon.id,
            variantId: dragonVariant?.id ?? null,
            qty: 1,
            unitPrice: dragon.price,
            total: dragon.price,
            productSnapshot: {
              name: dragon.name,
              price: dragon.price,
              color: 'Midnight Black',
            },
          },
        ],
      },
    },
  })

  console.log(`  ✅ Ahmad order: ${ahmadOrder.invoiceNumber}`)

  // Maria — Order 1: Planter Large (DELIVERED)
  const planterLarge = await prisma.productVariant.findFirst({
    where: { productId: planter.id, size: 'Large', color: 'Midnight Black' },
  })

  const mariaOrder1 = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202501', 2),
      source: 'WEBSITE',
      userId: mariaId,
      status: 'DELIVERED',
      subtotal: planter.price + 35000,
      shippingCost: 20000,
      total: planter.price + 35000 + 20000,
      shippingAddress: shippingAddress(
        'Maria Dewi',
        '087890123456',
        'Jl. Diponegoro No. 45',
        'Yogyakarta',
        'DI Yogyakarta',
        '55231',
      ),
      paidAt: new Date('2025-01-20T11:00:00Z'),
      items: {
        create: [
          {
            productId: planter.id,
            variantId: planterLarge?.id ?? null,
            qty: 1,
            unitPrice: planter.price + 35000,
            total: planter.price + 35000,
            productSnapshot: {
              name: planter.name,
              price: planter.price + 35000,
              color: 'Midnight Black',
              size: 'Large',
            },
          },
        ],
      },
    },
  })

  // Maria — Order 2: Stand + Organizer (PENDING_PAYMENT)
  const standWhite = await prisma.productVariant.findFirst({
    where: { productId: stand.id, color: 'Warm White' },
  })

  const mariaOrder2 = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber('202503', 1),
      source: 'WEBSITE',
      userId: mariaId,
      status: 'PENDING_PAYMENT',
      subtotal: stand.price + organizer.price,
      shippingCost: 20000,
      total: stand.price + organizer.price + 20000,
      shippingAddress: shippingAddress(
        'Maria Dewi',
        '087890123456',
        'Jl. Diponegoro No. 45',
        'Yogyakarta',
        'DI Yogyakarta',
        '55231',
      ),
      items: {
        create: [
          {
            productId: stand.id,
            variantId: standWhite?.id ?? null,
            qty: 1,
            unitPrice: stand.price,
            total: stand.price,
            productSnapshot: {
              name: stand.name,
              price: stand.price,
              color: 'Warm White',
            },
          },
          {
            productId: organizer.id,
            variantId: null,
            qty: 1,
            unitPrice: organizer.price,
            total: organizer.price,
            productSnapshot: { name: organizer.name, price: organizer.price },
          },
        ],
      },
    },
  })

  console.log(
    `  ✅ Maria orders: ${mariaOrder1.invoiceNumber}, ${mariaOrder2.invoiceNumber}`,
  )

  // ─── Reviews ───────────────────────────────────────────────────────────────

  await prisma.review.createMany({
    data: [
      {
        productId: dragon.id,
        userId: budiId,
        orderId: budiOrder1.id,
        rating: 5,
        comment:
          'Kualitas printnya luar biasa! Setiap sendi bergerak mulus. Bakal order lagi.',
        images: [],
        isVisible: true,
      },
      {
        productId: stand.id,
        userId: budiId,
        orderId: budiOrder1.id,
        rating: 4,
        comment:
          'Stabil dan kokoh, kabel slotnya sangat membantu. Bahan terasa solid.',
        images: [],
        isVisible: true,
      },
      {
        productId: planter.id,
        userId: mariaId,
        orderId: mariaOrder1.id,
        rating: 5,
        comment:
          'Pot tengkoraknya lucu banget! Sukuennya sangat cocok untuk kaktus kecilku.',
        images: [],
        isVisible: true,
      },
    ],
  })

  console.log('  ✅ Reviews seeded')

  // ─── Custom Orders ─────────────────────────────────────────────────────────

  await prisma.customOrderRequest.createMany({
    data: [
      {
        userId: ahmadId,
        description:
          'Bracket mount untuk espresso machine Breville, lebar 42mm, harus bisa menahan 3kg. Ada referensi gambar tapi belum bisa upload.',
        size: '42 × 30 × 20 mm',
        colorNote: 'Midnight Black — matte finish',
        budgetMin: 100000,
        budgetMax: 250000,
        status: 'QUOTED',
        quotedPrice: 175000,
        adminNotes:
          'Bracket sederhana, bisa produksi 3-4 hari. Konfirmasi ukuran sudah sesuai.',
        refImages: [],
      },
      {
        userId: sitiId,
        description:
          'Figurine karakter anime Nezuko dari Demon Slayer, pose tangan terbuka, tinggi sekitar 15cm. Warna pink dengan aksen hijau.',
        size: '15cm tinggi',
        colorNote: 'Coral — aksen Forest Green di kimono',
        budgetMin: 300000,
        budgetMax: 600000,
        status: 'UNDER_REVIEW',
        refImages: [],
      },
      {
        guestName: 'Rizky Pratama',
        guestEmail: 'rizky.pratama88@gmail.com',
        description:
          'Name plate meja kantor dengan nama "RIZKY PRATAMA" dan jabatan "Senior Engineer". Ukuran standar nameplate meja.',
        size: '20 × 6 cm',
        colorNote: 'Navy — tulisan Warm White',
        budgetMin: 75000,
        budgetMax: 150000,
        status: 'NEW',
        refImages: [],
      },
    ],
  })

  console.log('  ✅ Custom orders seeded')
}
