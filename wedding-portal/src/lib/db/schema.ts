import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "standard", "premium"]);

export const statusEnum = pgEnum("status", [
  "pending",
  "active",
  "suspended",
  "rejected",
]);

export const roleEnum = pgEnum("role", ["vendor", "admin"]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "closed",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "photography",
  "videography",
  "venue",
  "catering",
  "flowers",
  "music",
  "dj",
  "makeup",
  "dress",
  "suit",
  "cake",
  "invitation",
  "transport",
  "lighting",
  "planning",
  "wedding-dress-designers",
  "bridal-preparation",
  "other",
]);

// ─── vendors ──────────────────────────────────────────────────────────────────

export const vendors = pgTable(
  "vendors",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull().unique(),
    slug: text("slug").notNull().unique(),
    businessName: text("business_name").notNull(),
    category: vendorCategoryEnum("category").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    city: text("city").notNull(),
    region: text("region"),
    phone: text("phone"),
    email: text("email").notNull(),
    website: text("website"),
    whatsapp: text("whatsapp"),
    instagram: text("instagram"),
    tiktok: text("tiktok"),
    youtube: text("youtube"),
    facebook: text("facebook"),
    coverImage: text("cover_image"),
    logoImage: text("logo_image"),
    plan: planEnum("plan").notNull().default("free"),
    status: statusEnum("status").notNull().default("pending"),
    role: roleEnum("role").notNull().default("vendor"),
    featuredUntil: timestamp("featured_until"),
    viewCount: integer("view_count").notNull().default(0),
    leadCount: integer("lead_count").notNull().default(0),
    rating: real("rating"),
    reviewCount: integer("review_count").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    trialEndsAt: timestamp("trial_ends_at"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStatus: text("subscription_status"),
    subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("vendors_category_idx").on(table.category),
    index("vendors_status_idx").on(table.status),
    index("vendors_city_idx").on(table.city),
    index("vendors_plan_idx").on(table.plan),
  ]
);

// ─── vendor_media ─────────────────────────────────────────────────────────────

export const vendorMedia = pgTable(
  "vendor_media",
  {
    id: text("id").primaryKey().notNull(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    publicId: text("public_id"),
    type: mediaTypeEnum("type").notNull().default("image"),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("vendor_media_vendor_id_idx").on(table.vendorId)]
);

// ─── vendor_pricing ───────────────────────────────────────────────────────────

export const vendorPricing = pgTable(
  "vendor_pricing",
  {
    id: text("id").primaryKey().notNull(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    currency: text("currency").notNull().default("ILS"),
    isPopular: boolean("is_popular").notNull().default(false),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("vendor_pricing_vendor_id_idx").on(table.vendorId)]
);

// ─── leads ────────────────────────────────────────────────────────────────────

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey().notNull(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    eventDate: timestamp("event_date"),
    guestCount: integer("guest_count"),
    budget: integer("budget"),
    status: leadStatusEnum("status").notNull().default("new"),
    notes: text("notes"),
    submitterIp: text("submitter_ip"),
    aiScore: integer("ai_score"),
    aiScoreLabel: text("ai_score_label"), // "hot" | "warm" | "cold"
    aiScoreReason: text("ai_score_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("leads_vendor_id_idx").on(table.vendorId),
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
  ]
);

// ─── reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey().notNull(),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("reviews_vendor_id_idx").on(table.vendorId),
    index("reviews_is_published_idx").on(table.isPublished),
  ]
);

// ─── coupons ──────────────────────────────────────────────────────────────────

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey().notNull(),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── plan_overrides ───────────────────────────────────────────────────────────

export const planOverrides = pgTable("plan_overrides", {
  id: text("id").primaryKey().notNull(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" })
    .unique(),
  overridePlan: planEnum("override_plan").notNull(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

// ─── admin_logs ───────────────────────────────────────────────────────────────

export const adminLogs = pgTable(
  "admin_logs",
  {
    id: text("id").primaryKey().notNull(),
    adminId: text("admin_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("admin_logs_admin_id_idx").on(table.adminId),
    index("admin_logs_created_at_idx").on(table.createdAt),
  ]
);

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type VendorMedia = typeof vendorMedia.$inferSelect;
export type NewVendorMedia = typeof vendorMedia.$inferInsert;
export type VendorPricing = typeof vendorPricing.$inferSelect;
export type NewVendorPricing = typeof vendorPricing.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
