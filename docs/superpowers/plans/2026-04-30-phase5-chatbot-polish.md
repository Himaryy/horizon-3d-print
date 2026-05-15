# Phase 5 — AI Chatbot + Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Claude Haiku AI chatbot with 4 agent tools (floating widget, all pages), About page, 404/error pages, and final polish.

**Architecture:** Chatbot uses Anthropic SDK messages API with tool use. System prompt is cached (prompt caching). Only last 10 messages sent per request. Claude detects language and replies in same language as user. ChatSession + ChatMessage stored in DB. Floating widget rendered in root layout.

**Tech Stack:** `@anthropic-ai/sdk`, TanStack Start, Prisma

**Depends on:** Phase 1–4 complete

**This is the final phase for Phase 1 MVP.**

---

## File Map

```
src/
  routes/
    about.tsx                 # about page (/about)
  server/
    chatbot.ts                # chat server function (Claude agent)
  lib/
    claude.ts                 # Anthropic client + agent tool definitions
  components/
    chatbot/
      ChatWidget.tsx          # floating bottom-right widget
      ChatBubble.tsx          # single message bubble
```

---

## Task 29: Claude Agent Library

**Files:**

- Create: `src/lib/claude.ts`

- [ ] **Step 1: Write Claude agent tools and client**

```typescript
// src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { db } from './db'
import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Tool definitions ───────────────────────────────────────────────────────

export const AGENT_TOOLS: Tool[] = [
  {
    name: 'get_order_status',
    description:
      'Get the current status and tracking info for a customer order. Use when user asks about their order.',
    input_schema: {
      type: 'object' as const,
      properties: {
        orderId: {
          type: 'string',
          description:
            'The order ID provided by the user (full ID or last 8 chars)',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'search_products',
    description:
      'Search for products by name or keyword. Use when user asks what products are available.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search term (product name, character type, etc.)',
        },
        category: {
          type: 'string',
          enum: ['READY_MADE', 'CUSTOM_BASE'],
          description: 'Optional category filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_details',
    description:
      'Get detailed info about a specific product by its slug. Use when user asks about a specific product.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: {
          type: 'string',
          description: 'Product slug (URL identifier)',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Escalate the conversation to a human team member. Use when: user is frustrated, question is too complex, or user explicitly asks for human help.',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: {
          type: 'string',
          description: 'Brief reason for escalation',
        },
      },
      required: ['reason'],
    },
  },
]

// ─── Tool execution ──────────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  toolInput: Record<string, string>,
  sessionId: string,
): Promise<string> {
  switch (toolName) {
    case 'get_order_status': {
      const orderId = toolInput.orderId
      // Support partial ID (last N chars) — find by suffix
      const order = await db.order.findFirst({
        where: {
          OR: [{ id: orderId }, { id: { endsWith: orderId.toLowerCase() } }],
        },
        select: {
          id: true,
          status: true,
          trackingNumber: true,
          trackingUrl: true,
          paidAt: true,
          createdAt: true,
        },
      })

      if (!order) {
        return JSON.stringify({
          found: false,
          message: 'Order not found. Please check the ID.',
        })
      }

      return JSON.stringify({
        found: true,
        orderId: order.id.slice(-8).toUpperCase(),
        status: order.status,
        trackingNumber: order.trackingNumber ?? null,
        trackingUrl: order.trackingUrl ?? null,
        orderDate: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
      })
    }

    case 'search_products': {
      const products = await db.product.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          ...(toolInput.category
            ? { category: toolInput.category as 'READY_MADE' | 'CUSTOM_BASE' }
            : {}),
          OR: [
            { nameId: { contains: toolInput.query, mode: 'insensitive' } },
            { nameEn: { contains: toolInput.query, mode: 'insensitive' } },
            { descId: { contains: toolInput.query, mode: 'insensitive' } },
            { descEn: { contains: toolInput.query, mode: 'insensitive' } },
          ],
        },
        select: {
          slug: true,
          nameId: true,
          nameEn: true,
          price: true,
          stock: true,
          category: true,
        },
        take: 5, // max 5 results per spec
      })

      return JSON.stringify({ results: products, count: products.length })
    }

    case 'get_product_details': {
      const product = await db.product.findFirst({
        where: { slug: toolInput.slug, isPublished: true, deletedAt: null },
        select: {
          slug: true,
          nameId: true,
          nameEn: true,
          descId: true,
          descEn: true,
          price: true,
          stock: true,
          category: true,
          variants: {
            select: { color: true, size: true, priceAdjust: true, stock: true },
          },
          tokopediaUrl: true,
          shopeeUrl: true,
        },
      })

      if (!product) {
        return JSON.stringify({ found: false })
      }

      return JSON.stringify({ found: true, product })
    }

    case 'escalate_to_human': {
      // Mark session as escalated
      await db.chatSession.update({
        where: { id: sessionId },
        data: { escalated: true },
      })

      const whatsapp = process.env.TEAM_WHATSAPP ?? 'N/A'
      const email = process.env.GMAIL_USER ?? 'N/A'

      return JSON.stringify({
        escalated: true,
        whatsapp,
        email,
        message: `Conversation escalated. Contact: WhatsApp ${whatsapp} or email ${email}`,
      })
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }
}

// ─── System prompt (will be cached) ─────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `You are a helpful AI assistant for Brand3D, an Indonesian 3D printing startup that makes playful, articulated physical products (poseable figures, transformable toys, mechanical gadgets).

Your role:
- Answer questions about products, orders, custom orders, and shipping
- Help customers find the right product
- Check order status when asked
- Escalate to human when needed

Rules:
- Detect the user's language from their message and always reply in that language (Indonesian or English)
- Be friendly, concise, and helpful
- Use tools when you need real data (don't guess order status or product details)
- If you cannot confidently answer, use escalate_to_human
- Prices are in IDR (Indonesian Rupiah)
- The store is located in Indonesia

Business context:
- Products: ready-made catalog items + custom order service
- Custom orders: customer describes their idea, team reviews, quotes a price, then prints
- Shipping: within Indonesia only (for now)
- Payment: via Xendit (GoPay, OVO, bank transfer, credit card, etc.)
- Marketplace: some products also available on Tokopedia and Shopee`
}
```

- [ ] **Step 2: Write tool execution unit tests**

```typescript
// src/lib/claude.test.ts
import { describe, it, expect } from 'vitest'

describe('buildSystemPrompt', () => {
  it('contains key brand info', async () => {
    const { buildSystemPrompt } = await import('./claude')
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('Brand3D')
    expect(prompt).toContain('Indonesian')
    expect(prompt).toContain('IDR')
  })

  it('returns non-empty string', async () => {
    const { buildSystemPrompt } = await import('./claude')
    expect(buildSystemPrompt().length).toBeGreaterThan(100)
  })
})

describe('AGENT_TOOLS', () => {
  it('defines 4 tools', async () => {
    const { AGENT_TOOLS } = await import('./claude')
    expect(AGENT_TOOLS).toHaveLength(4)
  })

  it('all tools have required fields', async () => {
    const { AGENT_TOOLS } = await import('./claude')
    for (const tool of AGENT_TOOLS) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.input_schema).toBeTruthy()
    }
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/lib/claude.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/claude.ts src/lib/claude.test.ts
git commit -m "feat: Claude agent tools (order status, product search, detail, escalation)"
```

---

## Task 30: Chatbot Server Function

**Files:**

- Create: `src/server/chatbot.ts`

- [ ] **Step 1: Write chat server function**

```typescript
// src/server/chatbot.ts
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth'
import {
  anthropic,
  AGENT_TOOLS,
  executeTool,
  buildSystemPrompt,
} from '~/lib/claude'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

export const sendChatMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: { message: string; sessionKey: string }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null

    // Get or create chat session
    let chatSession = await db.chatSession.findUnique({
      where: { sessionKey: data.sessionKey },
    })

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          sessionKey: data.sessionKey,
          userId,
        },
      })
    } else if (userId && !chatSession.userId) {
      // Link to user if they logged in mid-chat
      await db.chatSession.update({
        where: { id: chatSession.id },
        data: { userId },
      })
    }

    // Save user message to DB
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'USER',
        content: data.message,
      },
    })

    // Load last 10 messages for context window (per spec)
    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    recentMessages.reverse() // oldest first

    const messages: MessageParam[] = recentMessages.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content,
    }))

    // Agentic loop — Claude may call tools multiple times
    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(),
          cache_control: { type: 'ephemeral' }, // prompt caching — ~90% cheaper on repeats
        },
      ],
      tools: AGENT_TOOLS,
      messages,
    })

    // Process tool calls in a loop (Claude may chain multiple tool calls)
    while (response.stop_reason === 'tool_use') {
      const assistantContent = response.content
      const toolUseBlocks = assistantContent.filter(
        (b) => b.type === 'tool_use',
      )

      // Execute all tool calls in this turn
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          if (block.type !== 'tool_use') return null
          const result = await executeTool(
            block.name,
            block.input as Record<string, string>,
            chatSession!.id,
          )
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: result,
          }
        }),
      )

      const validResults = toolResults.filter(Boolean)

      // Continue conversation with tool results
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: buildSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: AGENT_TOOLS,
        messages: [
          ...messages,
          { role: 'assistant', content: assistantContent },
          { role: 'user', content: validResults as MessageParam['content'] },
        ],
      })
    }

    // Extract final text response
    const assistantText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // Save assistant reply to DB
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'ASSISTANT',
        content: assistantText,
      },
    })

    return {
      reply: assistantText,
      sessionId: chatSession.id,
      escalated: chatSession.escalated,
    }
  })

export const getChatHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: { sessionKey: string }) => data)
  .handler(async ({ data }) => {
    const session = await db.chatSession.findUnique({
      where: { sessionKey: data.sessionKey },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    })

    return session?.messages ?? []
  })
```

- [ ] **Step 2: Commit**

```bash
git add src/server/chatbot.ts
git commit -m "feat: Claude chatbot server function with agentic loop and prompt caching"
```

---

## Task 31: ChatWidget Component

**Files:**

- Create: `src/components/chatbot/ChatBubble.tsx`
- Create: `src/components/chatbot/ChatWidget.tsx`
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Write ChatBubble**

```tsx
// src/components/chatbot/ChatBubble.tsx
import { clsx } from 'clsx'

interface ChatBubbleProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'USER'

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] px-3 py-2 rounded-[10px] text-sm leading-relaxed',
          isUser
            ? 'bg-[#2563eb] text-white rounded-br-sm'
            : 'bg-[#f3f4f6] text-[#111] rounded-bl-sm border-2 border-[#111]/10',
        )}
      >
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write ChatWidget**

```tsx
// src/components/chatbot/ChatWidget.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, X, Send } from 'lucide-react'
import { ChatBubble } from './ChatBubble'
import { sendChatMessage, getChatHistory } from '~/server/chatbot'
import { randomUUID } from 'crypto' // Node built-in; on client use crypto.randomUUID()

interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
}

// Get or create a persistent session key in localStorage
function getOrCreateSessionKey(): string {
  if (typeof window === 'undefined') return 'ssr-placeholder'
  const existing = localStorage.getItem('chat_session_key')
  if (existing) return existing
  const key = crypto.randomUUID()
  localStorage.setItem('chat_session_key', key)
  return key
}

export function ChatWidget() {
  const { t } = useTranslation('chatbot')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionKey] = useState(getOrCreateSessionKey)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load history on first open
  useEffect(() => {
    if (!open || messages.length > 0) return
    getChatHistory({ data: { sessionKey } }).then((history) => {
      if (history.length > 0) {
        setMessages(history.map((m) => ({ role: m.role, content: m.content })))
      } else {
        setMessages([{ role: 'ASSISTANT', content: t('greeting') }])
      }
    })
  }, [open, sessionKey, t])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'USER', content: text }])
    setLoading(true)

    try {
      const result = await sendChatMessage({
        data: { message: text, sessionKey },
      })
      setMessages((prev) => [
        ...prev,
        { role: 'ASSISTANT', content: result.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: t('error', { ns: 'common' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 h-[420px] bg-white border-2 border-[#111] rounded-[12px] shadow-[4px_4px_0_#111] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#2563eb] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#facc15] rounded-full animate-pulse" />
              <span className="text-white font-black text-sm">
                {t('title')}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f4f6] border-2 border-[#111]/10 px-3 py-2 rounded-[10px] rounded-bl-sm text-sm text-gray-400 italic">
                  {t('thinking')}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t-2 border-[#111]/10 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              disabled={loading}
              className="flex-1 border-2 border-[#111] rounded-[8px] px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-[#2563eb] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-[#2563eb] text-white rounded-[8px] p-2 hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#2563eb] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[3px_3px_0_#111] border-2 border-[#111] hover:bg-[#1d4ed8] transition-colors"
        aria-label={t('title')}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Add ChatWidget to root layout**

In `src/routes/__root.tsx`, add ChatWidget after `<Footer />`:

```tsx
// Add import at top:
import { ChatWidget } from '~/components/chatbot/ChatWidget'

// Add inside RootLayout, after Footer:
function RootLayout() {
  return (
    <RootDocument>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget /> {/* ← add this */}
    </RootDocument>
  )
}
```

- [ ] **Step 4: Test chatbot end-to-end**

```bash
pnpm dev
```

1. Open `http://localhost:3000`
2. Click blue chat button (bottom-right)
3. Send message: "Halo, ada produk apa saja?"
4. Expected: Claude replies with product search results (or asks to clarify)
5. Send: "Cek order [any-order-id]"
6. Expected: Claude calls `get_order_status` and replies with status

- [ ] **Step 5: Commit**

```bash
git add src/components/chatbot/ src/server/chatbot.ts src/routes/__root.tsx
git commit -m "feat: AI chatbot widget with Claude Haiku agent, tool use, and prompt caching"
```

---

## Task 32: About Page

**Files:**

- Create: `src/routes/about.tsx`

- [ ] **Step 1: Write about page**

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  const { i18n } = useTranslation()
  const id = i18n.language === 'id'

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="mb-16">
        <p className="text-xs font-black tracking-[3px] text-[#2563eb] mb-4">
          🖨️ TENTANG KAMI / ABOUT US
        </p>
        <h1 className="font-black text-5xl leading-tight mb-6">
          {id ? (
            <>
              Kami bikin mainan
              <br />
              <span className="text-[#2563eb]">yang bisa digerakkan.</span>
            </>
          ) : (
            <>
              We make toys
              <br />
              <span className="text-[#2563eb]">
                you can actually play with.
              </span>
            </>
          )}
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
          {id
            ? 'Brand3D adalah startup 3D printing dari Indonesia yang fokus membuat produk fisik yang playful — figur artikulasi, mainan transformable, dan gadget mekanikal. Setiap produk dibuat dengan teknologi cetak 3D dan dirancang untuk bisa digerakkan, dipose, dan dinikmati.'
            : 'Brand3D is an Indonesian 3D printing startup focused on playful physical products — articulated figures, transformable toys, and mechanical gadgets. Every product is 3D printed and designed to be poseable, interactive, and fun.'}
        </p>
      </div>

      {/* Values */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: '🎮',
            title: id ? 'Playful by Design' : 'Playful by Design',
            desc: id
              ? 'Produk kami bukan hiasan. Mereka bisa digerakkan, dipose, dan dimainkan setiap hari.'
              : "Our products aren't decorations. They're poseable, interactive, and made to be played with daily.",
          },
          {
            icon: '🇮🇩',
            title: id ? 'Dibuat di Indonesia' : 'Made in Indonesia',
            desc: id
              ? 'Dicetak dan dirakit di Indonesia dengan material berkualitas. Bangga lokal.'
              : 'Printed and assembled in Indonesia using quality materials. Proudly local.',
          },
          {
            icon: '✏️',
            title: id ? 'Custom untuk Kamu' : 'Custom for You',
            desc: id
              ? 'Tidak menemukan yang kamu mau? Deskripsikan idemu dan kami akan membuatnya.'
              : "Can't find what you want? Describe your idea and we'll build it for you.",
          },
        ].map((v) => (
          <div
            key={v.title}
            className="border-2 border-[#111] rounded-[10px] p-5"
          >
            <p className="text-3xl mb-3">{v.icon}</p>
            <h3 className="font-black text-lg mb-2">{v.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div>
        <h2 className="font-black text-2xl mb-6">
          {id ? '👥 Tim Kami' : '👥 Our Team'}
        </h2>
        <div className="flex gap-4 flex-wrap">
          {[
            {
              name: 'Founder 1',
              role: id ? 'Co-Founder & Design' : 'Co-Founder & Design',
              emoji: '🎨',
            },
            {
              name: 'Founder 2',
              role: id ? 'Co-Founder & Print' : 'Co-Founder & Print',
              emoji: '🖨️',
            },
          ].map((member) => (
            <div
              key={member.name}
              className="border-2 border-[#111] rounded-[10px] p-5 w-48 text-center"
            >
              <p className="text-4xl mb-2">{member.emoji}</p>
              <p className="font-black">{member.name}</p>
              <p className="text-gray-400 text-xs mt-1">{member.role}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-4 italic">
          {id
            ? '* Update nama dan foto setelah brand name diputuskan'
            : '* Update names and photos after brand name is decided'}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/about.tsx
git commit -m "feat: about page with team, values, and bilingual content"
```

---

## Task 33: Error Pages + Final Polish

**Files:**

- Modify: `src/routes/__root.tsx`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Add error boundary to root**

In `src/routes/__root.tsx`, add `errorComponent`:

```tsx
// Add imports:
import { ErrorComponent } from '@tanstack/react-router'

// Update createRootRoute:
export const Route = createRootRoute({
  // ... existing head config ...
  errorComponent: ({ error }) => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="font-black text-2xl">Terjadi Kesalahan</h1>
      <p className="text-gray-500 text-sm max-w-sm">
        {error instanceof Error ? error.message : 'Unexpected error occurred.'}
      </p>
      <a
        href="/"
        className="bg-[#2563eb] text-white font-black px-6 py-2.5 rounded-[8px] hover:bg-[#1d4ed8] transition-colors"
      >
        ← Kembali ke Home
      </a>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="font-black text-6xl text-[#2563eb]">404</h1>
      <p className="font-black text-xl">
        Halaman tidak ditemukan / Page not found
      </p>
      <a
        href="/"
        className="bg-[#2563eb] text-white font-black px-6 py-2.5 rounded-[8px] hover:bg-[#1d4ed8] transition-colors"
      >
        ← Kembali ke Home
      </a>
    </div>
  ),
  component: RootLayout,
})
```

- [ ] **Step 2: Create seed script with sample products**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Clear existing data
  await db.productImage.deleteMany()
  await db.productVariant.deleteMany()
  await db.product.deleteMany()

  // Seed sample products
  await db.product.create({
    data: {
      slug: 'robot-figure-v1',
      nameId: 'Figur Robot Artikulasi',
      nameEn: 'Articulated Robot Figure',
      descId:
        'Figur robot poseable dengan 12 titik sendi yang bisa digerakkan. Tinggi 15cm. Cocok untuk koleksi atau pajangan interaktif.',
      descEn:
        'Poseable robot figure with 12 articulated joints. 15cm tall. Perfect for collecting or interactive display.',
      price: 120000,
      stock: 50,
      category: 'READY_MADE',
      isPublished: true,
      isFeatured: true,
      tokopediaUrl: null,
      shopeeUrl: null,
      images: {
        create: [
          {
            url: 'https://placehold.co/400x400/dbeafe/2563eb?text=Robot+Figure',
            alt: 'Robot Figure Front',
            order: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            color: 'Gray',
            size: 'Standard',
            priceAdjust: 0,
            stock: 30,
            sku: 'ROBOT-GRY-STD',
          },
          {
            color: 'Black',
            size: 'Standard',
            priceAdjust: 10000,
            stock: 20,
            sku: 'ROBOT-BLK-STD',
          },
        ],
      },
    },
  })

  await db.product.create({
    data: {
      slug: 'dragon-pose-v1',
      nameId: 'Naga Poseable',
      nameEn: 'Poseable Dragon',
      descId:
        'Naga 3D printed dengan sayap yang bisa dibuka-tutup dan ekor fleksibel. Tinggi 20cm.',
      descEn:
        '3D printed dragon with openable wings and flexible tail. 20cm tall.',
      price: 185000,
      stock: 25,
      category: 'READY_MADE',
      isPublished: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://placehold.co/400x400/fef9c3/713f12?text=Dragon',
            alt: 'Dragon Figure',
            order: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            color: 'Green',
            size: 'Standard',
            priceAdjust: 0,
            stock: 15,
            sku: 'DRAGON-GRN-STD',
          },
          {
            color: 'Red',
            size: 'Standard',
            priceAdjust: 15000,
            stock: 10,
            sku: 'DRAGON-RED-STD',
          },
        ],
      },
    },
  })

  await db.product.create({
    data: {
      slug: 'mech-arm-v1',
      nameId: 'Lengan Mekanikal',
      nameEn: 'Mechanical Arm',
      descId:
        'Lengan robotik poseable dengan 6 DOF (degrees of freedom). Bisa digerakkan 360 derajat.',
      descEn:
        'Poseable robotic arm with 6 DOF (degrees of freedom). 360-degree rotation.',
      price: 95000,
      stock: 40,
      category: 'READY_MADE',
      isPublished: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://placehold.co/400x400/dcfce7/14532d?text=Mech+Arm',
            alt: 'Mech Arm',
            order: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            color: 'Silver',
            size: 'Small',
            priceAdjust: 0,
            stock: 20,
            sku: 'MECHARM-SLV-SM',
          },
          {
            color: 'Silver',
            size: 'Large',
            priceAdjust: 25000,
            stock: 20,
            sku: 'MECHARM-SLV-LG',
          },
        ],
      },
    },
  })

  console.log('✅ Seed complete — 3 products created')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

Add seed script to `package.json`:

```json
// In package.json, add to "scripts":
"db:seed": "npx tsx prisma/seed.ts"
```

Install tsx if not present:

```bash
pnpm add -D tsx
```

- [ ] **Step 3: Run seed**

```bash
pnpm db:seed
```

Expected: `✅ Seed complete — 3 products created`

- [ ] **Step 4: Verify home page shows products**

```bash
pnpm dev
```

Open `http://localhost:3000` — three product cards should appear in featured section with slight tilts.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: error pages, 404 component, and seed script with sample products"
```

---

## Phase 5 Complete — Phase 1 MVP Done

Full end-to-end verification checklist:

```
Pages working:
[ ] / — home: hero, featured products, custom CTA
[ ] /products — catalog with filter tabs
[ ] /products/:slug — detail with images, 3D toggle, variants, marketplace links
[ ] /custom — custom order form, Cloudinary upload, success state
[ ] /cart — cart with qty controls
[ ] /checkout — address form, Xendit redirect
[ ] /order/:id — status with stepper, tracking, pay button
[ ] /login — email/password + Google OAuth
[ ] /register — sign up + auto-login
[ ] /account — order history + logout
[ ] /about — team, values, bilingual

Features working:
[ ] i18n toggle (🇮🇩 / 🇬🇧) in navbar persists via cookie
[ ] Guest cart → login → cart merges
[ ] Full checkout → Xendit invoice → webhook → PAID status
[ ] Order confirmation email received
[ ] Custom order → team notification email
[ ] AI chatbot opens bottom-right
[ ] Chatbot search_products tool works
[ ] Chatbot get_order_status tool works
[ ] Chatbot escalate_to_human marks session escalated

TypeScript:
[ ] npx tsc --noEmit — 0 errors

Tests:
[ ] npx vitest run — all PASS
```

**Phase 2+ (deferred):** Admin panel, AI image generation on custom order page, inventory sync.
