import { auth } from '#/lib/auth'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const authFnMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    return next({
      context: {
        session,
        user: session?.user ?? null,
      },
    })
  },
)

export const requireUserFnMiddleware = createMiddleware({ type: 'function' })
  .middleware([authFnMiddleware])
  .server(async ({ context, next }) => {
    const user = context.user

    if (!user) {
      throw new Error('Unauthorized')
    }

    return next({
      context: {
        ...context,
        user,
      },
    })
  })

export const requireAdminFnMiddleware = createMiddleware({ type: 'function' })
  .middleware([requireUserFnMiddleware])
  .server(async ({ context, next }) => {
    const admin = context.user.role === 'admin'

    if (!admin) {
      throw new Error('Forbidden')
    }

    return next({ context })
  })
