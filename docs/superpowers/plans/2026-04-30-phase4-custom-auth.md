# Phase 4 — Custom Order + Auth Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build custom order submission form (with Cloudinary image upload) and all auth pages (login, register, account/order history).

**Architecture:** Custom order form allows both guests and logged-in users. Images uploaded directly to Cloudinary via signed upload. Auth pages use Better Auth's `signIn`, `signUp` hooks. On login, guest cart merges automatically.

**Tech Stack:** TanStack Start, Better Auth, Cloudinary Node SDK (server-side signed upload), Prisma

**Depends on:** Phase 1–3 complete

**Next phase:** `2026-04-30-phase5-chatbot-polish.md`

---

## File Map

```
src/
  routes/
    custom.tsx              # custom order form (/custom)
    login.tsx               # login page (/login)
    register.tsx            # register page (/register)
    account.tsx             # account: order history + profile (/account)
  server/
    custom-orders.ts        # server functions for custom order submission
  lib/
    cloudinary.ts           # signed upload helper
  components/
    custom/
      CustomOrderForm.tsx   # multi-step custom order form
    auth/
      AuthForm.tsx          # shared email/password fields
```

---

## Task 23: Cloudinary Upload Helper

**Files:**
- Create: `src/lib/cloudinary.ts`

- [ ] **Step 1: Write Cloudinary server helper**

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// Returns a signed upload signature for direct browser uploads.
// The browser uploads directly to Cloudinary — file never passes through our server.
export function getSignedUploadParams(folder: string): {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
} {
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { folder, timestamp }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
  }
}

// Upload a file buffer from server (used for 3D models and videos seeded by admin)
export async function uploadBuffer(
  buffer: Buffer,
  options: { folder: string; resourceType?: 'image' | 'video' | 'raw' }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder, resource_type: options.resourceType ?? 'image' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'))
        resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}
```

- [ ] **Step 2: Write upload signature test**

```typescript
// src/lib/cloudinary.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')
vi.stubEnv('CLOUDINARY_API_KEY', 'test-key')
vi.stubEnv('CLOUDINARY_API_SECRET', 'test-secret')

describe('getSignedUploadParams', () => {
  it('returns required fields', async () => {
    const { getSignedUploadParams } = await import('./cloudinary')
    const params = getSignedUploadParams('custom-orders')

    expect(params.cloudName).toBe('test-cloud')
    expect(params.apiKey).toBe('test-key')
    expect(params.folder).toBe('custom-orders')
    expect(typeof params.signature).toBe('string')
    expect(params.signature.length).toBeGreaterThan(0)
    expect(typeof params.timestamp).toBe('number')
  })
})
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/lib/cloudinary.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/cloudinary.ts src/lib/cloudinary.test.ts
git commit -m "feat: Cloudinary signed upload helper for direct browser uploads"
```

---

## Task 24: Custom Order Server Functions

**Files:**
- Create: `src/server/custom-orders.ts`

- [ ] **Step 1: Write custom order server functions**

```typescript
// src/server/custom-orders.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth'
import { getSignedUploadParams } from '~/lib/cloudinary'
import { sendCustomOrderNotification } from '~/lib/email'

// Returns Cloudinary signed params for direct browser upload of reference images
export const getUploadSignature = createServerFn({ method: 'GET' }).handler(() => {
  return getSignedUploadParams('custom-orders')
})

export const submitCustomOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    description: string
    refImages: string[]    // Cloudinary URLs after direct upload
    size?: string
    colorNote?: string
    budgetMin?: number
    budgetMax?: number
    guestEmail?: string
    guestName?: string
  }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null

    if (!userId && !data.guestEmail) {
      throw new Error('Email diperlukan untuk tamu / Email required for guests')
    }

    if (!data.description || data.description.trim().length < 10) {
      throw new Error('Deskripsi terlalu pendek (min 10 karakter)')
    }

    const order = await db.customOrderRequest.create({
      data: {
        userId,
        guestEmail: data.guestEmail ?? null,
        guestName: data.guestName ?? null,
        description: data.description.trim(),
        refImages: data.refImages,
        size: data.size ?? null,
        colorNote: data.colorNote ?? null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
      },
    })

    // Notify team via email
    await sendCustomOrderNotification({
      adminEmail: process.env.GMAIL_USER!, // team email = same Gmail
      requestId: order.id,
      description: order.description,
      guestEmail: order.guestEmail ?? undefined,
    })

    return { id: order.id }
  })
```

- [ ] **Step 2: Commit**

```bash
git add src/server/custom-orders.ts
git commit -m "feat: custom order server functions with Cloudinary upload signature and email notification"
```

---

## Task 25: Custom Order Page

**Files:**
- Create: `src/routes/custom.tsx`
- Create: `src/components/custom/CustomOrderForm.tsx`

- [ ] **Step 1: Write CustomOrderForm component**

```tsx
// src/components/custom/CustomOrderForm.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/Button'
import { getUploadSignature, submitCustomOrder } from '~/server/custom-orders'

interface FormState {
  description: string
  size: string
  colorNote: string
  budgetMin: string
  budgetMax: string
  guestEmail: string
  guestName: string
}

interface Props {
  isLoggedIn: boolean
  onSuccess: (orderId: string) => void
}

export function CustomOrderForm({ isLoggedIn, onSuccess }: Props) {
  const { i18n } = useTranslation()
  const id = i18n.language === 'id'

  const [form, setForm] = useState<FormState>({
    description: '', size: '', colorNote: '',
    budgetMin: '', budgetMax: '',
    guestEmail: '', guestName: '',
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Direct upload to Cloudinary via signed params
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const sigParams = await getUploadSignature()
      const urls: string[] = []

      for (const file of files.slice(0, 5)) { // max 5 reference images
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', sigParams.apiKey)
        formData.append('timestamp', String(sigParams.timestamp))
        formData.append('signature', sigParams.signature)
        formData.append('folder', sigParams.folder)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sigParams.cloudName}/image/upload`,
          { method: 'POST', body: formData },
        )
        const data = await res.json()
        if (data.secure_url) urls.push(data.secure_url)
      }

      setUploadedImages(prev => [...prev, ...urls])
    } catch {
      setError(id ? 'Gagal upload gambar' : 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await submitCustomOrder({
        data: {
          description: form.description,
          refImages: uploadedImages,
          size: form.size || undefined,
          colorNote: form.colorNote || undefined,
          budgetMin: form.budgetMin ? parseInt(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? parseInt(form.budgetMax) : undefined,
          guestEmail: !isLoggedIn ? form.guestEmail : undefined,
          guestName: !isLoggedIn ? form.guestName : undefined,
        },
      })
      onSuccess(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : (id ? 'Terjadi kesalahan' : 'Something went wrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Guest fields */}
      {!isLoggedIn && (
        <div className="grid md:grid-cols-2 gap-4 p-4 border-2 border-dashed border-[#2563eb] rounded-[10px] bg-[#eff6ff]">
          <p className="md:col-span-2 text-sm font-black text-[#2563eb]">
            {id ? '👤 Isi data kamu (tamu)' : '👤 Your details (guest)'}
          </p>
          <div>
            <label className="block text-sm font-bold mb-1">{id ? 'Nama' : 'Name'} *</label>
            <input required value={form.guestName} onChange={e => setField('guestName', e.target.value)}
              placeholder="Budi Santoso"
              className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Email *</label>
            <input required type="email" value={form.guestEmail} onChange={e => setField('guestEmail', e.target.value)}
              placeholder="email@contoh.com"
              className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block font-black mb-1">
          {id ? 'Deskripsikan idemu *' : 'Describe your idea *'}
        </label>
        <p className="text-xs text-gray-400 mb-2">
          {id
            ? 'Ceritakan detail: karakter apa, pose seperti apa, ukuran, dll.'
            : 'Tell us: what character, what pose, size, details, etc.'}
        </p>
        <textarea
          required
          minLength={10}
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          rows={5}
          placeholder={id ? 'Saya ingin figur naga yang bisa digerakkan, dengan sayap yang bisa dibuka...' : 'I want a poseable dragon figure with openable wings...'}
          className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb] resize-none"
        />
      </div>

      {/* Reference images */}
      <div>
        <label className="block font-black mb-1">
          {id ? 'Gambar referensi (opsional)' : 'Reference images (optional)'}
        </label>
        <p className="text-xs text-gray-400 mb-2">
          {id ? 'Max 5 foto. Foto karakter, sketsa, atau apapun yang bisa bantu kami.' : 'Max 5 images. Character photos, sketches, or anything that helps.'}
        </p>

        <input type="file" accept="image/*" multiple onChange={handleFileChange}
          className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:border-2 file:border-[#111] file:rounded-[6px] file:font-black file:text-sm file:bg-white hover:file:bg-[#eff6ff] file:cursor-pointer" />

        {uploading && <p className="text-xs text-[#2563eb] mt-2 font-semibold">⏳ {id ? 'Mengupload...' : 'Uploading...'}</p>}

        {uploadedImages.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {uploadedImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`ref-${i}`} className="w-16 h-16 object-cover rounded border-2 border-[#111]" />
                <button
                  type="button"
                  onClick={() => setUploadedImages(imgs => imgs.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-black"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Size + color */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-sm mb-1">{id ? 'Ukuran (opsional)' : 'Size (optional)'}</label>
          <input value={form.size} onChange={e => setField('size', e.target.value)}
            placeholder={id ? 'cth: 15cm, segenggam tangan' : 'e.g. 15cm, palm-sized'}
            className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div>
          <label className="block font-bold text-sm mb-1">{id ? 'Warna (opsional)' : 'Color preference (optional)'}</label>
          <input value={form.colorNote} onChange={e => setField('colorNote', e.target.value)}
            placeholder={id ? 'cth: merah dan hitam' : 'e.g. red and black'}
            className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block font-black mb-1">{id ? 'Budget (opsional)' : 'Budget (optional)'}</label>
        <div className="flex items-center gap-3">
          <input type="number" value={form.budgetMin} onChange={e => setField('budgetMin', e.target.value)}
            placeholder={id ? 'Min (IDR)' : 'Min (IDR)'}
            className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
          <span className="font-bold text-gray-400">–</span>
          <input type="number" value={form.budgetMax} onChange={e => setField('budgetMax', e.target.value)}
            placeholder={id ? 'Max (IDR)' : 'Max (IDR)'}
            className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

      <Button type="submit" chunky size="lg" className="w-full" disabled={submitting || uploading}>
        {submitting ? (id ? '⏳ Mengirim...' : '⏳ Submitting...') : (id ? '📤 Kirim Pesanan Custom' : '📤 Submit Custom Order')}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Write custom page route**

```tsx
// src/routes/custom.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '~/lib/auth-client'
import { CustomOrderForm } from '~/components/custom/CustomOrderForm'

export const Route = createFileRoute('/custom')({
  component: CustomPage,
})

function CustomPage() {
  const { i18n } = useTranslation()
  const { data: session } = useSession()
  const [successId, setSuccessId] = useState<string | null>(null)
  const id = i18n.language === 'id'

  if (successId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h2 className="font-black text-2xl mb-3">
          {id ? 'Pesanan dikirim!' : 'Order submitted!'}
        </h2>
        <p className="text-gray-500 mb-2">
          {id ? 'Tim kami akan review dan menghubungi kamu dalam 1-2 hari kerja.' : 'Our team will review and contact you within 1-2 business days.'}
        </p>
        <p className="text-xs text-gray-400 font-mono">ID: {successId.slice(-12).toUpperCase()}</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link to="/" className="text-[#2563eb] font-bold hover:underline">← Home</Link>
          <Link to="/products" className="text-[#2563eb] font-bold hover:underline">Lihat Produk</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-black tracking-[3px] text-[#2563eb] mb-3">✏️ CUSTOM ORDER</p>
        <h1 className="font-black text-4xl md:text-5xl leading-tight mb-4">
          {id ? (
            <>Desain <span className="text-[#2563eb]">milikmu</span><br /><span className="bg-[#facc15] px-2">sendiri.</span></>
          ) : (
            <>Your own<br /><span className="text-[#2563eb]">design.</span></>
          )}
        </h1>
        <p className="text-gray-500">
          {id
            ? 'Ceritakan idemu, upload referensi, dan kami akan mencetak untuk kamu.'
            : 'Tell us your idea, upload a reference, and we\'ll print it for you.'}
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: '📝', step: id ? '1. Isi form' : '1. Fill form' },
          { icon: '💬', step: id ? '2. Tim review & quote' : '2. Team reviews & quotes' },
          { icon: '🖨️', step: id ? '3. Kita cetak!' : '3. We print it!' },
        ].map(({ icon, step }) => (
          <div key={step} className="text-center p-3 border-2 border-[#111] rounded-[10px] bg-[#eff6ff]">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xs font-black leading-tight">{step}</p>
          </div>
        ))}
      </div>

      <CustomOrderForm
        isLoggedIn={!!session?.user}
        onSuccess={setSuccessId}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify custom order page**

```bash
pnpm dev
```

Open `http://localhost:3000/custom` — verify:
- Form renders with all fields
- File upload picker visible
- Guest email fields appear when not logged in
- Submit shows success state

- [ ] **Step 4: Commit**

```bash
git add src/routes/custom.tsx src/components/custom/ src/server/custom-orders.ts
git commit -m "feat: custom order page with Cloudinary image upload and email notification"
```

---

## Task 26: Login Page

**Files:**
- Create: `src/routes/login.tsx`

- [ ] **Step 1: Write login page**

```tsx
// src/routes/login.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '~/lib/auth-client'
import { mergeGuestCart } from '~/server/cart'
import { Button } from '~/components/ui/Button'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message ?? 'Login gagal')
      setLoading(false)
      return
    }

    // Merge guest cart after login
    const sessionKey = localStorage.getItem('cart_session')
    if (sessionKey) {
      try {
        await mergeGuestCart({ data: { sessionKey } })
        localStorage.removeItem('cart_session')
      } catch {
        // Non-fatal — cart merge failure doesn't block login
      }
    }

    navigate({ to: '/' })
  }

  async function handleGoogleLogin() {
    await signIn.social({ provider: 'google', callbackURL: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[#111] rounded-[10px] p-8 shadow-[4px_4px_0_#111]">
          <h1 className="font-black text-2xl mb-1">Masuk</h1>
          <p className="text-gray-400 text-sm mb-6">Login to your Brand3D account</p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full border-2 border-[#111] rounded-[8px] py-2.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-[#eff6ff] transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Lanjut dengan Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <input
                required type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <Button type="submit" chunky size="lg" className="w-full" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          <p className="text-center text-sm mt-4 text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#2563eb] font-bold hover:underline">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/login.tsx
git commit -m "feat: login page with email/password and Google OAuth"
```

---

## Task 27: Register Page

**Files:**
- Create: `src/routes/register.tsx`

- [ ] **Step 1: Write register page**

```tsx
// src/routes/register.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signUp, signIn } from '~/lib/auth-client'
import { Button } from '~/components/ui/Button'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

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

    const result = await signUp.email({ name, email, password })

    if (result.error) {
      setError(result.error.message ?? 'Pendaftaran gagal')
      setLoading(false)
      return
    }

    // Auto-login after register
    await signIn.email({ email, password })
    navigate({ to: '/' })
  }

  async function handleGoogleLogin() {
    await signIn.social({ provider: 'google', callbackURL: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[#111] rounded-[10px] p-8 shadow-[4px_4px_0_#111]">
          <h1 className="font-black text-2xl mb-1">Daftar</h1>
          <p className="text-gray-400 text-sm mb-6">Buat akun Brand3D kamu</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full border-2 border-[#111] rounded-[8px] py-2.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-[#eff6ff] transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Daftar dengan Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Nama Lengkap</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Budi Santoso"
                className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <input required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 karakter"
                className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]" />
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <Button type="submit" chunky size="lg" className="w-full" disabled={loading}>
              {loading ? 'Mendaftar...' : 'Daftar'}
            </Button>
          </form>

          <p className="text-center text-sm mt-4 text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#2563eb] font-bold hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/register.tsx
git commit -m "feat: register page with auto-login after signup"
```

---

## Task 28: Account Page

**Files:**
- Create: `src/routes/account.tsx`
- Modify: `src/server/orders.ts` — add `getUserOrders`

- [ ] **Step 1: Add getUserOrders to orders server**

Add to `src/server/orders.ts`:

```typescript
export const getUserOrders = createServerFn({ method: 'GET' }).handler(async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) throw new Error('Not authenticated')

  return db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      items: {
        select: {
          id: true, qty: true, total: true, productSnapshot: true,
        },
      },
    },
  })
})
```

- [ ] **Step 2: Write account page**

```tsx
// src/routes/account.tsx
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { signOut, useSession } from '~/lib/auth-client'
import { getUserOrders } from '~/server/orders'
import { Badge } from '~/components/ui/Badge'
import type { OrderStatus } from '@prisma/client'

export const Route = createFileRoute('/account')({
  loader: async ({ context }) => {
    try {
      return await getUserOrders()
    } catch {
      throw redirect({ to: '/login' })
    }
  },
  component: AccountPage,
})

const statusColors: Record<OrderStatus, 'gray' | 'yellow' | 'blue' | 'green' | 'red'> = {
  PENDING_PAYMENT: 'yellow',
  PAID: 'blue',
  PROCESSING: 'blue',
  PRINTING: 'blue',
  SHIPPED: 'green',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REFUNDED: 'gray',
}

function AccountPage() {
  const { t } = useTranslation('checkout')
  const { data: session } = useSession()
  const orders = Route.useLoaderData()

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  async function handleLogout() {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-black text-xl">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-black text-lg">{session?.user?.name}</p>
            <p className="text-gray-400 text-sm">{session?.user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="text-sm font-bold text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors">
          {t('nav.logout', { ns: 'common' })}
        </button>
      </div>

      {/* Order history */}
      <h2 className="font-black text-2xl mb-6">📦 Riwayat Pesanan</h2>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold">Belum ada pesanan</p>
          <Link to="/products" className="text-[#2563eb] font-bold hover:underline mt-3 inline-block">Mulai belanja →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to="/order/$id"
              params={{ id: order.id }}
              className="block border-2 border-[#111] rounded-[10px] p-4 hover:shadow-[4px_4px_0_#111] transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-gray-400">#{order.id.slice(-12).toUpperCase()}</p>
                  <p className="font-black text-lg mt-1">{fmt(order.total)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Badge color={statusColors[order.status as OrderStatus]}>
                  {t(`status_${order.status.toLowerCase()}` as Parameters<typeof t>[0])}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update Navbar to show user/logout when logged in**

In `src/components/layout/Navbar.tsx`, replace the static login link with:

```tsx
// Add at top of Navbar component:
const { data: session } = useSession()

// Replace the auth section with:
{session?.user ? (
  <Link to="/account"
    className="text-white/80 hover:text-white text-sm font-semibold transition-colors">
    {session.user.name?.split(' ')[0] ?? t('nav.account')}
  </Link>
) : (
  <Link to="/login"
    className="text-white/80 hover:text-white text-sm font-semibold transition-colors">
    {t('nav.login')}
  </Link>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/routes/account.tsx src/server/orders.ts src/components/layout/Navbar.tsx
git commit -m "feat: account page with order history and logout; navbar auth state"
```

---

## Phase 4 Complete

Verify before moving to Phase 5:

```bash
# Auth flow:
# 1. /register → create account → auto-login → redirected to /
# 2. /login → email+password → redirected to /
# 3. /login → Google OAuth → Google consent → redirected to /
# 4. /account → shows empty order history when logged in
# 5. Logout → redirected to /, navbar shows Login

# Guest cart merge:
# 1. Add item to cart while logged out (guest sessionKey in cookie)
# 2. Login → cart items appear in user cart

# Custom order:
# 1. /custom as guest → fill form with email → submit → success screen
# 2. Team email received

npx vitest run
# All tests pass
```

**Next:** `2026-04-30-phase5-chatbot-polish.md`
