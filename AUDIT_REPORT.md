# WeddingPro — Pre-Flight Audit Report
_Generated: 2026-04-19_

---

## 1. Stack Versions (from package.json)

| Package | Version |
|---|---|
| next | 16.1.6 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| tailwindcss | ^4 |
| @tailwindcss/postcss | ^4 |
| drizzle-orm | ^0.45.1 |
| drizzle-kit | ^0.31.9 |
| @supabase/ssr | ^0.9.0 |
| @supabase/supabase-js | ^2.99.0 |
| @anthropic-ai/sdk | ^0.54.0 |
| stripe | ^20.4.1 |
| @stripe/stripe-js | ^8.9.0 |
| resend | ^6.9.3 |
| cloudinary | ^2.9.0 |
| typescript | ^5 |
| zod | ^4.3.6 |

**Other notable dependencies:** framer-motion ^12.35.2, react-hook-form ^7.71.2, @hookform/resolvers ^5.2.2, nuqs ^2.8.9, sonner ^2.0.7, lucide-react ^0.577.0, next-themes ^0.4.6, next-mdx-remote ^6.0.0, gray-matter ^4.0.3, vitest ^3.2.4

---

## 2. Schema Snapshot

**File:** `src/lib/db/schema.ts`

### Enums

| Enum | Values |
|---|---|
| `plan` | free, standard, premium |
| `status` | pending, active, suspended, rejected |
| `role` | vendor, admin |
| `media_type` | image, video |
| `lead_status` | new, contacted, qualified, closed |
| `discount_type` | percentage, fixed |
| `vendor_category` | photography, videography, venue, catering, flowers, music, dj, makeup, dress, suit, cake, invitation, transport, lighting, planning, wedding-dress-designers, bridal-preparation, other |
| `automation_channel` | n8n, waha, email, ai, cron |
| `automation_status` | sent, failed, skipped, pending |
| `blog_post_status` | draft, published, archived |

---

### Table: `vendors`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| userId | text | unique |
| slug | text | unique |
| businessName | text | |
| category | vendor_category enum | |
| description | text | |
| shortDescription | text | |
| city | text | |
| region | text | |
| phone | text | |
| email | text | |
| website | text | |
| whatsapp | text | |
| instagram | text | |
| tiktok | text | |
| youtube | text | |
| facebook | text | |
| coverImage | text | |
| logoImage | text | |
| plan | plan enum | |
| status | status enum | |
| role | role enum | |
| featuredUntil | timestamp | |
| viewCount | int | |
| leadCount | int | |
| rating | real | |
| reviewCount | int | |
| seoTitle | text | |
| seoDescription | text | |
| trialEndsAt | timestamp | |
| stripeCustomerId | text | |
| stripeSubscriptionId | text | |
| subscriptionStatus | text | |
| subscriptionCurrentPeriodEnd | timestamp | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Indexes:** category, status, city, plan

---

### Table: `vendor_media`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| vendorId | text | FK → vendors (cascade delete) |
| url | text | |
| publicId | text | |
| type | media_type enum | image / video |
| altText | text | |
| sortOrder | int | |
| createdAt | timestamp | |

**Indexes:** vendor_id

---

### Table: `vendor_pricing`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| vendorId | text | FK → vendors (cascade delete) |
| name | text | |
| description | text | |
| price | int | |
| currency | text | default ILS |
| isPopular | bool | |
| features | jsonb | array |
| sortOrder | int | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Indexes:** vendor_id

---

### Table: `leads`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| vendorId | text | FK → vendors (cascade delete) |
| name | text | |
| email | text | |
| phone | text | |
| message | text | |
| eventDate | timestamp | |
| guestCount | int | |
| budget | int | |
| status | lead_status enum | |
| notes | text | |
| submitterIp | text | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Indexes:** vendor_id, status, created_at

---

### Table: `reviews`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| vendorId | text | FK → vendors (cascade delete) |
| authorName | text | |
| authorEmail | text | |
| rating | int | |
| title | text | |
| body | text | |
| isVerified | bool | |
| isPublished | bool | |
| createdAt | timestamp | |

**Indexes:** vendor_id, is_published

---

### Table: `coupons`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| code | text | unique |
| discountType | discount_type enum | |
| discountValue | int | |
| maxUses | int | |
| usedCount | int | |
| validFrom | timestamp | |
| validUntil | timestamp | |
| isActive | bool | |
| createdAt | timestamp | |

---

### Table: `plan_overrides`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| vendorId | text | FK → vendors (unique) |
| overridePlan | plan enum | |
| reason | text | |
| expiresAt | timestamp | |
| createdAt | timestamp | |
| createdBy | text | |

---

### Table: `admin_logs`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| adminId | text | |
| action | text | |
| targetType | text | |
| targetId | text | |
| metadata | jsonb | |
| createdAt | timestamp | |

**Indexes:** admin_id, created_at

---

### Table: `automation_logs`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| event | text | |
| channel | automation_channel enum | |
| status | automation_status enum | |
| payload | jsonb | |
| responseCode | int | |
| durationMs | int | |
| error | text | |
| vendorId | text | FK → vendors (set null) |
| leadId | text | FK → leads (set null) |
| createdAt | timestamp | |

**Indexes:** event, channel, status, created_at

---

### Table: `blog_posts`

| Column | Type | Notes |
|---|---|---|
| id | text | PK |
| slug | text | unique |
| title | text | |
| excerpt | text | |
| content | text | MDX/Markdown |
| coverImage | text | |
| author | text | default "צוות WeddingPro" |
| category | text | default "general" |
| tags | jsonb | array |
| seoTitle | text | |
| seoDescription | text | |
| status | blog_post_status enum | |
| isAiGenerated | bool | |
| publishedAt | timestamp | |
| viewCount | int | |
| readingTimeMinutes | int | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**Indexes:** slug, status, category, published_at

---

## 3. API Routes

**File location:** `src/app/api/**/*.ts`

| Route | Methods | Purpose | External Services |
|---|---|---|---|
| `/api/ping` | GET | Keep Supabase alive (cron every 3 days) | PostgreSQL |
| `/api/register-free` | POST | Register vendor with 3-month trial via coupon validation | Supabase Auth, PostgreSQL, Resend |
| `/api/onboarding-save` | POST | Update vendor profile (business name, category, city, contacts, social) | Supabase Auth, PostgreSQL |
| `/api/checkout` | POST | Create Stripe checkout session for paid plan upgrade | Stripe |
| `/api/contact` | POST | Submit contact form and email admin | Resend |
| `/api/leads` | POST | Create lead with IP rate-limiting, notify vendor + admin, trigger webhook | PostgreSQL, Resend, N8N |
| `/api/reviews` | POST | Submit review for vendor (pending moderation), notify admin | PostgreSQL, Resend |
| `/api/upload` | POST, DELETE, PATCH | Upload/delete/reorder media, enforce plan limits | Supabase Auth, PostgreSQL, Cloudinary |
| `/api/ai-description` | POST | Generate vendor description with Claude Haiku | Supabase Auth, Anthropic |
| `/api/vendors/[id]/view` | POST | Increment vendor view counter | PostgreSQL |
| `/api/stripe/webhook` | POST | Handle Stripe events: checkout, subscription updates, invoice failures | Stripe, Supabase Auth, PostgreSQL, Resend |
| `/api/stripe/portal` | POST | Create Stripe Billing Portal session for authenticated vendor | Supabase Auth, PostgreSQL, Stripe |
| `/api/admin/status` | GET | Comprehensive system health check (DB, enums, Supabase admin API, env vars) | Supabase Auth, PostgreSQL, Supabase Admin API |
| `/api/admin/coolify/status` | GET, POST | Monitor/restart Coolify deployment apps | Supabase Auth, Coolify API |
| `/api/admin/waha/status` | GET, POST | Check WAHA WhatsApp session status, retrieve QR code | Supabase Auth, WAHA API |
| `/api/admin/blog-generate` | GET, POST | AI-generate blog posts from predefined topics (Claude Sonnet), notify via N8N | Supabase Auth, PostgreSQL, Anthropic, N8N |
| `/api/admin/blog/generate` | POST | Generate blog post ideas/content from AI | Supabase Auth, PostgreSQL, Anthropic, N8N |
| `/api/admin/blog/posts` | GET, PATCH, DELETE | List, update status, or delete blog posts | Supabase Auth, PostgreSQL |
| `/api/admin/auth-diagnostic` | GET | Full auth chain diagnostic (env vars, Supabase API, coupon, OAuth, password auth test) | Supabase Auth, Supabase Admin API, PostgreSQL |
| `/api/admin/rescue-vendor` | GET, POST | Diagnose or rescue vendor registration (create vendor record for existing Supabase user) | Supabase Auth, Supabase Admin API, PostgreSQL |
| `/api/admin/health-check` | GET | Monitor DB, pending vendors, leads, automation errors; send alert emails | PostgreSQL, Resend, WAHA |
| `/api/admin/seed-coupon` | GET | Idempotently create WEDDINGPRO launch coupon | Supabase Auth, PostgreSQL |
| `/api/admin/run-migration` | POST | Apply pending Drizzle migrations via DIRECT_URL (bypasses PgBouncer for DDL) | Supabase Auth, PostgreSQL (direct) |
| `/api/admin/test-register` | GET | Full simulation of /api/register-free with test data creation/cleanup | Supabase Auth, Supabase Admin API, PostgreSQL |
| `/api/admin/automations/test` | POST | Test automation channels (N8N webhooks, WAHA, email, AI, cron) | Supabase Auth, N8N, WAHA |
| `/api/admin/automations/logs` | GET | Query automation logs with filters; return 24h channel stats | Supabase Auth, PostgreSQL |

**Total:** 26 route handlers

---

## 4. Homepage Components

**File:** `src/app/(marketing)/page.tsx`
**Type:** Server Component (async function, no `useState` / `useEffect` / client hooks)

### Imports

| Component | Source | Server/Client |
|---|---|---|
| `Link` | next/link | Server |
| `MessageCircle`, `Star`, `Users`, `ArrowLeft`, `ChevronLeft` | lucide-react | Server |
| `eq`, `desc`, `and` | drizzle-orm | Server |
| `db` | @/lib/db/db | Server |
| `vendors` | @/lib/db/schema | Server |
| `VendorCard` | @/components/vendor/VendorCard | Server |
| `Footer` | @/components/layout/Footer | Server |
| `CookieBanner` | @/components/shared/CookieBanner | Client (banner interaction) |
| `HeroSlideshow` | @/components/marketing/HeroSlideshow | Client (animation) |
| `AnimatedStats` | @/components/marketing/AnimatedStats | Client (animation) |
| `AnimatedCategories` | @/components/marketing/AnimatedCategories | Client (animation) |

### Server-Side Data Fetching

- `getVendorCount()` — queries count of active vendors from DB; fallback `"50+"`
- `getFeaturedVendors()` — queries 6 active premium vendors ordered by viewCount; fallback mock data
- Both run in parallel via `Promise.all()`
- No `useEffect`, no client-side fetching

### JSON-LD Structured Data

- `WebSite` schema with SearchAction
- `Organization` schema

### JSX Structure Tree

```
HomePage (async Server Component)
├── <script> WebSite JSON-LD
├── <script> Organization JSON-LD
└── <div> (dir="rtl", bg-ivory)
    ├── HeroSlideshow                          [Client – slideshow animation]
    ├── AnimatedStats                          [Client – counter animation, props: stats[]]
    ├── <section> Categories
    │   └── <div> max-w-6xl
    │       ├── <div> text-center
    │       │   ├── <p> font-script text-gold (label)
    │       │   └── <h2> font-display (heading)
    │       └── AnimatedCategories             [Client – category grid animation]
    ├── <section> Featured Vendors (bg-cream-white)
    │   └── <div> max-w-6xl
    │       ├── <div> flex header row
    │       │   ├── <div>
    │       │   │   ├── <p> font-script
    │       │   │   └── <h2> font-display
    │       │   └── <Link> "כל הספקים" (desktop, hidden sm:flex)
    │       ├── <div> grid cols-1/sm:2/lg:3 gap-5
    │       │   └── [6× VendorCard]            [Server – vendor data props]
    │       └── <div> text-center mt-10 sm:hidden
    │           └── <Link> "כל הספקים" (mobile)
    ├── <section> How It Works
    │   └── <div> max-w-6xl
    │       ├── <div> text-center
    │       │   ├── <p> font-script
    │       │   └── <h2> font-display
    │       └── <div> grid cols-1/sm:3 gap-6
    │           └── [3× step card]
    │               ├── <span> step number
    │               ├── <div> icon badge
    │               ├── <h3> title
    │               └── <p> description
    ├── <section> Vendor CTA (bg-obsidian text-white)
    │   ├── <div> decorative bg gradients (absolute)
    │   └── <div> relative max-w-3xl
    │       ├── <p> font-script text-gold
    │       ├── <h2> font-display
    │       ├── <p> description
    │       ├── <div> flex gap-4
    │       │   ├── <Link> href="/join/free" (bg-gold CTA)
    │       │   └── <Link> href="/pricing" (border CTA)
    │       └── <p> trial info text
    ├── Footer                                 [Server]
    └── CookieBanner                           [Client – cookie consent]
```

---

## Summary: External Services

| Service | Used For |
|---|---|
| **Supabase Auth** | User authentication, session management, admin user operations |
| **Supabase PostgreSQL** | All data persistence via Drizzle ORM |
| **Stripe** | Checkout sessions, subscriptions, billing portal, webhooks |
| **Resend** | All transactional email (welcome, leads, reviews, admin alerts) |
| **Anthropic Claude** | AI vendor descriptions (Haiku), AI blog generation (Sonnet) |
| **Cloudinary** | Image/video upload, storage, asset management |
| **N8N** | Webhook automations (leads, registrations, blog publish) |
| **WAHA** | WhatsApp session management and message sending |
| **Coolify** | Deployment status monitoring and app restarts |
