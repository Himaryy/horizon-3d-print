import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Slider } from '#/components/ui/slider'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { authClient } from '#/lib/auth-client'
import { formatIDR } from '#/lib/format'
import { fadeUp, stagger, staggerItem, viewport } from '#/lib/motion'
import type { CustomOrderFormDataProps } from '#/lib/types'
import { createFileRoute } from '@tanstack/react-router'
import { ImagePlus, Send } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

export const Route = createFileRoute('/_home/custom')({ component: CustomPage })

const BUDGET_MIN = 50000
const BUDGET_MAX = 5000000

const FILAMENT_COLORS = [
  { name: 'Midnight Black', hex: '#16110A' },
  { name: 'Warm White', hex: '#FFFDF7' },
  { name: 'Sky Blue', hex: '#5BB8FF' },
  { name: 'Gold', hex: '#FFC23C' },
  { name: 'Stone Grey', hex: '#9B8E76' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Brick Red', hex: '#C1440E' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Coral', hex: '#FF6B6B' },
  { name: 'Transparent', hex: '#A9DAFF' },
]

function CustomPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [form, setForm] = useState<CustomOrderFormDataProps>({
    description: '',
    size: '',
    colors: [],
    colorNote: '',
    budgetMin: 100000,
    budgetMax: 1000000,
    guestName: '',
    guestEmail: '',
  })

  function handleChange(
    field: keyof CustomOrderFormDataProps,
    value: string | number,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleColorToggle(colorName: string) {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorName)
        ? prev.colors.filter((c) => c !== colorName)
        : [...prev.colors, colorName],
    }))
  }

  function handleBudgetChange(values: number[]) {
    setForm((prev) => ({ ...prev, budgetMin: values[0], budgetMax: values[1] }))
  }

  function handleSubmit() {
    // TODO: wire to serverFn → save CustomOrderRequest to DB
    console.log('submit', form)
  }

  return (
    <main className="mx-auto max-w-360 px-8 py-10 flex flex-col gap-12 pb-24">
      {/* Hero */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-[28px] bg-ink px-10 py-12 lg:px-14 lg:py-16"
      >
        <p className="t-eyebrow text-fog mb-3">Upload & Quote</p>
        <h1 className="h-display text-[clamp(2.5rem,7vw,5.5rem)] text-paper leading-[0.92] mb-4">
          Got a design?{' '}
          <span className="h-serif-italic font-stretch-normal text-sky">
            We'll print it.
          </span>
        </h1>
        <p className="text-[16px] text-fog max-w-lg leading-relaxed">
          Describe what you need, set your budget, and we'll get back with a
          quote within 24 hours. No CAD skills needed.
        </p>
      </motion.div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* Left — main form */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="flex flex-col gap-8"
        >
          {/* Step 1 */}
          <motion.div variants={staggerItem} className="flex flex-col gap-4">
            <div>
              <p className="t-eyebrow text-fog mb-1">Step 1</p>
              <h2 className="h-display text-[24px] text-ink">
                Describe your design
              </h2>
            </div>
            <Separator />

            <div className="flex flex-col gap-2">
              <Label className="t-eyebrow">What do you want printed?</Label>
              <Textarea
                placeholder="E.g. A bracket for my espresso machine, 40mm wide, needs to hold 2kg. Or: articulated dragon, similar to your existing one but bigger."
                className="min-h-30 resize-none"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="t-eyebrow">Size / Dimensions</Label>
              <Input
                placeholder="E.g. 20 × 15 × 10 cm, or roughly fist-sized"
                value={form.size}
                onChange={(e) => handleChange('size', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="t-eyebrow">
                Reference Images{' '}
                <span className="text-fog normal-case font-normal">(optional)</span>
              </Label>
              <div className="card-soft rounded-[14px] border-dashed! p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-ink transition-colors">
                <ImagePlus className="size-8 text-fog" strokeWidth={1.5} />
                <p className="text-[13px] text-fog text-center">
                  Drag & drop images here, or click to browse
                  <br />
                  <span className="t-eyebrow">JPG, PNG, up to 10MB each</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={staggerItem} className="flex flex-col gap-4">
            <div>
              <p className="t-eyebrow text-fog mb-1">Step 2</p>
              <h2 className="h-display text-[24px] text-ink">Options & budget</h2>
            </div>
            <Separator />

            <div className="flex flex-col gap-3">
              <Label className="t-eyebrow">
                Colors{' '}
                <span className="text-fog normal-case font-normal">— pick all that apply</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {FILAMENT_COLORS.map((c) => {
                  const selected = form.colors.includes(c.name)
                  return (
                    <Tooltip key={c.name}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleColorToggle(c.name)}
                          className={`w-9 h-9 rounded-full border-2 transition-all ${
                            selected
                              ? 'border-ink scale-110 shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--ink)]'
                              : 'border-line hover:border-ink'
                          }`}
                          style={{ background: c.hex }}
                          aria-label={c.name}
                        />
                      </TooltipTrigger>
                      <TooltipContent>{c.name}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              <Input
                placeholder="Additional notes — e.g. matte finish, closest to Pantone 485"
                value={form.colorNote}
                onChange={(e) => handleChange('colorNote', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label className="t-eyebrow">Budget range</Label>
                <span className="t-mono text-[13px] text-ink">
                  {formatIDR(form.budgetMin)} — {formatIDR(form.budgetMax)}
                </span>
              </div>
              <Slider
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={50000}
                value={[form.budgetMin, form.budgetMax]}
                onValueChange={handleBudgetChange}
                className="w-full"
              />
              <div className="flex justify-between t-eyebrow text-fog">
                <span>{formatIDR(BUDGET_MIN)}</span>
                <span>{formatIDR(BUDGET_MAX)}</span>
              </div>
            </div>
          </motion.div>

          {/* Step 3 — guest only */}
          {!user && (
            <motion.div variants={staggerItem} className="flex flex-col gap-4">
              <div>
                <p className="t-eyebrow text-fog mb-1">Step 3</p>
                <h2 className="h-display text-[24px] text-ink">Contact info</h2>
              </div>
              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="t-eyebrow">Your name</Label>
                  <Input
                    placeholder="Budi Santoso"
                    value={form.guestName}
                    onChange={(e) => handleChange('guestName', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="t-eyebrow">Email</Label>
                  <Input
                    type="email"
                    placeholder="budi@email.com"
                    value={form.guestEmail}
                    onChange={(e) => handleChange('guestEmail', e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right — summary card sticky */}
        <div className="card p-6 flex flex-col gap-4 lg:sticky lg:top-24">
          <h2 className="h-display text-[22px] text-ink">Your Request</h2>
          <Separator />

          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-fog t-eyebrow">Description</span>
              <span className="text-ink text-right max-w-45 truncate">
                {form.description || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fog t-eyebrow">Size</span>
              <span className="text-ink">{form.size || '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-fog t-eyebrow shrink-0">Colors</span>
              <span className="text-ink text-right text-[13px]">
                {form.colors.length > 0 ? form.colors.join(', ') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fog t-eyebrow">Budget</span>
              <span className="t-mono text-ink text-[13px]">
                {formatIDR(form.budgetMin)} — {formatIDR(form.budgetMax)}
              </span>
            </div>
            {user && (
              <div className="flex justify-between">
                <span className="text-fog t-eyebrow">Account</span>
                <span className="text-ink truncate max-w-45">{user.email}</span>
              </div>
            )}
          </div>

          <Separator />

          <Button
            className="btn btn-accent w-full h-12 text-[15px]"
            onClick={handleSubmit}
            disabled={!form.description}
          >
            <Send className="size-4" />
            Submit Quote Request
          </Button>

          <p className="text-[12px] text-fog text-center">
            We'll reply within 24 hours · No payment now
          </p>
        </div>
      </div>
    </main>
  )
}
