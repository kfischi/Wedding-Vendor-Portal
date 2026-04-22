# Claude Project Template — Full-Stack SaaS with AI, Automations & Integrations

> Copy this prompt to start a new project with the same architecture, integrations, and patterns.
> Replace all `[PLACEHOLDER]` values with your project details.

---

## MASTER PROMPT — New Project Bootstrap

```
You are building a full-stack SaaS product called [PROJECT_NAME].
Niche: [NICHE — e.g. wedding vendors, real estate agents, freelancers, etc.]
Language: [Hebrew RTL / English LTR]
Audience: [B2B / B2C / marketplace]

## Stack (do not deviate)
- Next.js 15 (App Router, React Server Components)
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- Drizzle ORM (PostgreSQL dialect)
- Supabase (PostgreSQL + Auth)
- Stripe (subscriptions)
- Cloudinary (media)
- Resend (transactional email)
- Anthropic Claude SDK (AI features)
- N8N (automation webhooks)
- WAHA (WhatsApp HTTP API, self-hosted on Coolify)
- Netlify (deployment)
- pnpm (package manager)

## Plans & Pricing
- Free trial: [X] days
- Standard: [PRICE]/mo — features: [LIST]
- Premium: [PRICE]/mo — features: [LIST]

## Design tokens
- Primary palette: [COLOR1, COLOR2, COLOR3]
- Fonts: [HEADING_FONT + BODY_FONT + ACCENT_FONT]
- Direction: [RTL / LTR]

## Database schema to create
Build Drizzle ORM schema with these entities:
[LIST YOUR ENTITIES — see reference schema below]

## Integrations to wire up (in order)
1. Supabase Auth (JWT, role: vendor/admin in user metadata)
2. Stripe webhooks → create user + record in DB on payment
3. Cloudinary upload API (plan-gated file limits)
4. Resend email notifications (lead alerts, welcome, admin alerts)
5. Anthropic Claude (lead scoring, content generation)
6. N8N webhook events: lead.new, user.registered, payment.completed
7. WAHA WhatsApp: notify vendor + admin on new lead

## API routes to implement
[See reference API map below]

## Pages to implement
[LIST YOUR PAGES]

## Follow these architectural patterns exactly
- Rate limiting: database-backed, per-IP + per-email
- Webhooks: fire-and-forget (void), non-blocking
- AI: async, graceful fallback, cost-optimized model (claude-haiku)
- Error responses: JSON + HTTP status codes, user messages in [LANGUAGE]
- HTML escaping: all user input before email rendering
- Stripe webhook signature verification (never skip)
- Atomic DB operations for counters (sql`field + 1`)
- Server Components by default, Client Components only for interactivity
```

---

## Reference: Database Schema (Drizzle ORM)

```typescript
// src/lib/db/schema.ts

import { pgTable, pgEnum, text, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// --- Enums ---
export const planEnum = pgEnum('plan', ['free', 'standard', 'premium'])
export const statusEnum = pgEnum('status', ['pending', 'active', 'suspended', 'rejected'])
export const roleEnum = pgEnum('role', ['vendor', 'admin'])
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video'])
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'closed'])
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed'])

// --- Core: Vendors ---
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),         // Supabase Auth UID
  slug: text('slug').notNull().unique(),
  businessName: text('business_name').notNull(),
  category: text('category').notNull(),               // Use pgEnum for your niche
  city: text('city'),
  phone: text('phone'),
  email: text('email'),
  whatsapp: text('whatsapp'),
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  youtube: text('youtube'),
  facebook: text('facebook'),
  description: text('description'),
  coverImage: text('cover_image'),
  logoImage: text('logo_image'),
  plan: planEnum('plan').default('free').notNull(),
  status: statusEnum('status').default('pending').notNull(),
  featuredUntil: timestamp('featured_until'),
  viewCount: integer('view_count').default(0).notNull(),
  leadCount: integer('lead_count').default(0).notNull(),
  rating: integer('rating').default(0),
  reviewCount: integer('review_count').default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// --- Media Gallery ---
export const vendorMedia = pgTable('vendor_media', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  url: text('url').notNull(),
  publicId: text('public_id').notNull(),              // Cloudinary publicId
  type: mediaTypeEnum('type').default('image').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- Leads ---
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  eventDate: text('event_date'),
  guestCount: integer('guest_count'),
  budget: text('budget'),
  status: leadStatusEnum('status').default('new').notNull(),
  notes: text('notes'),
  submitterIp: text('submitter_ip'),
  // AI scoring
  aiScore: integer('ai_score'),
  aiScoreLabel: text('ai_score_label'),               // hot / warm / cold
  aiScoreReason: text('ai_score_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- Reviews ---
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body').notNull(),
  isVerified: boolean('is_verified').default(false),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- Pricing Tiers ---
export const vendorPricing = pgTable('vendor_pricing', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price'),
  currency: text('currency').default('ILS'),
  isPopular: boolean('is_popular').default(false),
  features: jsonb('features'),
  sortOrder: integer('sort_order').default(0),
})

// --- Messages Log ---
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  leadId: integer('lead_id').references(() => leads.id),
  channel: text('channel').notNull(),                 // email | whatsapp
  recipient: text('recipient').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  status: text('status').default('sent'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- Coupons ---
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- Admin Logs ---
export const adminLogs = pgTable('admin_logs', {
  id: serial('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

## Reference: Environment Variables

```env
# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://...

# ─── Stripe ───
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# ─── Cloudinary ───
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ─── Resend (Email) ───
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+972...

# ─── AI ───
ANTHROPIC_API_KEY=sk-ant-...

# ─── N8N Automation ───
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/...
N8N_API_KEY=

# ─── WhatsApp (WAHA) ───
WHATSAPP_SERVICE_URL=https://waha.yourdomain.com
WHATSAPP_SERVICE_API_KEY=
WAHA_SESSION=default

# ─── App ───
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Reference: N8N Integration Library

```typescript
// src/lib/n8n.ts

type N8NEvent =
  | 'lead.new'
  | 'user.registered'
  | 'payment.completed'

interface N8NPayload {
  event: N8NEvent
  timestamp: string
  data: Record<string, unknown>
}

export async function triggerN8N(event: N8NEvent, data: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return

  const payload: N8NPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_API_KEY && { Authorization: `Bearer ${process.env.N8N_API_KEY}` }),
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[N8N] Webhook failed:', err)
  }
}
```

---

## Reference: WAHA WhatsApp Library

```typescript
// src/lib/whatsapp.ts

const WAHA_URL = process.env.WHATSAPP_SERVICE_URL
const WAHA_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY
const WAHA_SESSION = process.env.WAHA_SESSION ?? 'default'

/** Convert Israeli format 05X → 972X@c.us */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return `972${digits.slice(1)}@c.us`
  if (digits.startsWith('972')) return `${digits}@c.us`
  return `${digits}@c.us`
}

export async function sendWhatsApp(phone: string, message: string) {
  if (!WAHA_URL) return

  const chatId = normalizePhone(phone)

  await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_API_KEY ?? '',
    },
    body: JSON.stringify({
      session: WAHA_SESSION,
      chatId,
      text: message,
    }),
  })
}

export async function sendWhatsAppBatch(recipients: { phone: string; message: string }[]) {
  for (const r of recipients) {
    await sendWhatsApp(r.phone, r.message)
    await new Promise(res => setTimeout(res, 800)) // rate limit
  }
}
```

---

## Reference: AI Lead Scoring

```typescript
// src/lib/ai/score-lead.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface ScoreResult {
  score: number           // 0–100
  label: 'hot' | 'warm' | 'cold'
  reason: string
}

export async function scoreLead(lead: {
  name: string
  message: string
  eventDate?: string
  guestCount?: number
  budget?: string
}): Promise<ScoreResult | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Score this business lead from 0-100 and label it hot/warm/cold.

Lead:
- Name: ${lead.name}
- Message: ${lead.message}
- Event date: ${lead.eventDate ?? 'not specified'}
- Guest count: ${lead.guestCount ?? 'not specified'}
- Budget: ${lead.budget ?? 'not specified'}

Respond with valid JSON only:
{"score": 85, "label": "hot", "reason": "Brief reason in [LANGUAGE]"}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return JSON.parse(text) as ScoreResult
  } catch {
    return null
  }
}
```

---

## Reference: API Routes Map

```
POST /api/leads              — submit lead (rate-limited, triggers email + AI + WhatsApp + N8N)
GET  /api/leads              — fetch vendor leads (protected)
POST /api/reviews            — submit review (rate-limited)
POST /api/reviews/request    — vendor requests review from customer
POST /api/upload             — upload to Cloudinary (plan-gated)
POST /api/checkout           — create Stripe checkout session
POST /api/stripe/webhook     — Stripe payment webhook
GET  /api/stripe/portal      — Stripe billing portal redirect
POST /api/register-free      — register free trial
POST /api/onboarding-save    — save vendor profile (protected)
POST /api/messaging/send     — send email or WhatsApp to lead (protected)
GET  /api/ai/lead-insights   — Claude analysis of vendor's leads (protected)
POST /api/ai/generate-description — Claude generates vendor bio (protected)
POST /api/vendors/[id]/view  — increment view count (atomic)
POST /api/contact            — public contact form
GET  /api/agent/monitor      — health check
```

---

## Reference: New Lead Flow (copy-paste pattern)

```typescript
// src/app/api/leads/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  // 1. Validate with Zod
  // 2. Rate limit check (IP + email-per-vendor)
  // 3. Insert lead into DB (atomic counter increment)
  const [lead] = await db.insert(leads).values({...}).returning()
  await db.execute(sql`UPDATE vendors SET lead_count = lead_count + 1 WHERE id = ${vendorId}`)

  // 4-9. Fire-and-forget (non-blocking)
  void sendVendorLeadEmail(vendor, lead)
  void sendAdminLeadEmail(lead)
  void scoreLead(lead).then(score => score && updateLeadScore(lead.id, score))
  void sendWhatsApp(vendor.whatsapp!, message)
  void sendWhatsApp(process.env.ADMIN_PHONE!, adminMessage)
  void triggerN8N('lead.new', { leadId: lead.id, vendorId })

  return Response.json({ ok: true, leadId: lead.id })
}
```

---

## Reference: Stripe Webhook Pattern

```typescript
// src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  // 1. Verify signature (NEVER skip)
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_email!
    const plan = session.metadata?.plan as 'standard' | 'premium'

    // 2. Create Supabase user (admin client)
    const { data: { user } } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: 'vendor', plan },
    })

    // 3. Create vendor record
    await db.insert(vendors).values({
      userId: user!.id,
      email,
      plan,
      status: 'active',
      stripeCustomerId: session.customer as string,
    })

    // 4. Send welcome email + password reset link
    const { data: { properties } } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })
    await sendWelcomeEmail(email, properties.action_link)

    // 5. Trigger N8N
    void triggerN8N('payment.completed', { email, plan })
  }

  return Response.json({ received: true })
}
```

---

## Reference: Coolify — WAHA Docker Compose

```yaml
# coolify/waha.docker-compose.yml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      WHATSAPP_API_KEY: ${WAHA_API_KEY}
      WHATSAPP_HOOK_URL: ${WAHA_HOOK_URL}
    volumes:
      - waha_data:/app/.sessions

volumes:
  waha_data:
```

---

## Reference: Netlify Config

```toml
# netlify.toml
[build]
  base = "[PROJECT_FOLDER]"
  command = "pnpm install --frozen-lockfile && npx tsc --noEmit && pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
  NEXT_EXPERIMENTAL_TURBOPACK_USE_SYSTEM_TLS_CERTS = "true"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Reference: N8N Workflow Structure (for each event)

```json
{
  "name": "lead-new",
  "nodes": [
    { "type": "n8n-nodes-base.webhook", "parameters": { "path": "lead-new", "httpMethod": "POST" } },
    { "type": "n8n-nodes-base.if", "parameters": { "conditions": { "string": [{ "value1": "={{$json.event}}", "value2": "lead.new" }] } } },
    { "type": "n8n-nodes-base.set", "parameters": {} },
    { "type": "n8n-nodes-base.httpRequest", "name": "WhatsApp", "parameters": { "url": "={{$env.WAHA_URL}}/api/sendText", "method": "POST" } },
    { "type": "n8n-nodes-base.telegram", "name": "Telegram Admin", "parameters": {} },
    { "type": "n8n-nodes-base.emailSend", "name": "Email Vendor", "parameters": {} }
  ]
}
```

---

## Phase Build Order (recommended)

```
Phase 1 — Foundation
  ✓ Next.js project setup (pnpm create next-app)
  ✓ Tailwind 4 + design tokens
  ✓ Drizzle schema + migrations
  ✓ Supabase project + Auth + RLS

Phase 2 — Auth & Payments
  ✓ Supabase Auth (login, session middleware)
  ✓ Stripe checkout + webhook
  ✓ Dashboard shell (protected routes)

Phase 3 — Core Product
  ✓ Public profile pages /[slug]
  ✓ Lead capture form + rate limiting
  ✓ Gallery (Cloudinary upload + display)

Phase 4 — Admin
  ✓ Admin panel (/admin/*)
  ✓ Vendor management
  ✓ MRR dashboard

Phase 5 — Automation & AI
  ✓ N8N webhook integration
  ✓ WAHA WhatsApp (deploy on Coolify)
  ✓ Claude lead scoring + insights
  ✓ Resend email notifications

Phase 6 — Marketing
  ✓ Homepage (hero, stats, categories, featured)
  ✓ Vendor directory (search + filters + pagination)
  ✓ Blog (MDX)
  ✓ Legal pages (privacy, terms, cookies)

Phase 7 — Polish
  ✓ SEO: sitemap.xml, robots.txt, OG images
  ✓ Performance: ISR/SSG for public pages
  ✓ Reviews flow
  ✓ Video hero support
```

---

## Checklist: Before Launch

```
[ ] All env vars set in Netlify + Coolify
[ ] Stripe webhook endpoint registered (events: checkout.session.completed)
[ ] WAHA session started + QR scanned
[ ] N8N workflows imported + activated
[ ] Supabase RLS enabled on all tables
[ ] Admin user created manually in Supabase
[ ] DNS + SSL configured
[ ] Error monitoring (Sentry optional)
[ ] Rate limit tested (lead form)
[ ] Stripe test mode → live mode switch
```

---

*Template generated from Wedding Vendor Portal codebase. Claude, 2026.*
