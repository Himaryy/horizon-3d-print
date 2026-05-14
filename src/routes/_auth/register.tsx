import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { authClient } from '#/lib/auth-client'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_auth/register')({ component: RegisterPage })

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#16110A" />
      <rect x="9" y="10" width="3.2" height="20" fill="#FFC23C" />
      <rect x="27.8" y="10" width="3.2" height="20" fill="#5BB8FF" />
      <rect x="9" y="18.5" width="22" height="3" fill="#FFFDF7" />
      <circle cx="32" cy="9" r="1.5" fill="#FFC23C" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/account',
    })
    if (signUpError) setError(signUpError.message ?? 'Registration failed.')
    setLoading(false)
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/account' })
  }

  return (
    <div className="card w-full max-w-sm p-8 flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-1.5 t-eyebrow text-fog hover:text-ink transition-colors w-fit"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>

      <div className="flex flex-col items-center gap-2 text-center">
        <LogoMark size={36} />
        <div>
          <h1 className="h-display text-[22px] text-ink">Create account</h1>
          <p className="text-[13px] text-fog mt-1">Start printing with Horizon 3D</p>
        </div>
      </div>

      <Separator />

      <button
        type="button"
        onClick={handleGoogle}
        className="btn btn-ghost w-full flex items-center gap-2.5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="t-eyebrow text-fog">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="t-eyebrow">Full Name</Label>
          <Input
            type="text"
            placeholder="Budi Santoso"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="t-eyebrow">Email</Label>
          <Input
            type="email"
            placeholder="budi@email.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="t-eyebrow">Password</Label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="btn btn-accent w-full h-11">
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-fog">
        Already have an account?{' '}
        <Link to="/login" className="text-sky font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
