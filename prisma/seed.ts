import { prisma } from '#/db'
import { seedAdmin } from './seeds/seed-admin'
import { seedProducts } from './seeds/seed-products'
import { seedCustomers } from './seeds/seed-customers'

async function main() {
  console.log('🌱 Seeding...\n')

  console.log('👤 Admin')
  await seedAdmin()

  console.log('\n📦 Products')
  await seedProducts()

  console.log('\n🧑‍🤝‍🧑 Customers')
  await seedCustomers()

  console.log('\n✅ Done.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
