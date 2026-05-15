import { auth } from '#/lib/auth'
import { prisma } from '#/db'

const ADMIN_EMAIL = 'admin.h3d@horizon.com'
const ADMIN_NAME = 'Horizon Admin'
const ADMIN_PASSWORD = 'Horizon3D#Admin'

export async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existing) {
    console.log(
      `  ⚠️  Admin already exists (${ADMIN_EMAIL}). Ensuring role=admin.`,
    )
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: 'admin' },
    })
    return
  }

  await auth.api.signUpEmail({
    body: { name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })

  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { role: 'admin' },
  })

  console.log(`  ✅ Admin created: ${ADMIN_EMAIL}`)
}
