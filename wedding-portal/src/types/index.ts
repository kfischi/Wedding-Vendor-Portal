// ─── Enums ────────────────────────────────────────────────────────────────────

export type Plan = "free" | "standard" | "premium";

export type Status = "pending" | "active" | "suspended" | "rejected";

export type Role = "vendor" | "admin";

export type LeadStatus = "new" | "contacted" | "qualified" | "closed";

export type VendorCategory =
  | "photography"
  | "videography"
  | "venue"
  | "catering"
  | "flowers"
  | "music"
  | "dj"
  | "makeup"
  | "dress"
  | "suit"
  | "cake"
  | "invitation"
  | "transport"
  | "lighting"
  | "planning"
  | "wedding-dress-designers"
  | "other";

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  userId: string;
  slug: string;
  businessName: string;
  category: VendorCategory;
  description: string | null;
  shortDescription: string | null;
  city: string;
  region: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  coverImage: string | null;
  logoImage: string | null;
  plan: Plan;
  status: Status;
  role: Role;
  featuredUntil: Date | null;
  viewCount: number;
  leadCount: number;
  rating: number | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = "image" | "video";

export interface VendorMedia {
  id: string;
  vendorId: string;
  url: string;
  publicId: string | null;
  type: MediaType;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface VendorPricing {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  isPopular: boolean;
  features: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  eventDate: Date | null;
  guestCount: number | null;
  budget: number | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  vendorId: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  isPublished: boolean;
  createdAt: Date;
}

// ─── Coupon ───────────────────────────────────────────────────────────────────

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// ─── API / Forms ──────────────────────────────────────────────────────────────

export interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  eventDate?: string;
  guestCount?: number;
  budget?: number;
}

export interface VendorFilters {
  category?: VendorCategory;
  city?: string;
  region?: string;
  plan?: Plan;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "views" | "leads" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Stripe / Billing ─────────────────────────────────────────────────────────

export interface SubscriptionInfo {
  plan: Plan;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalViews: number;
  totalLeads: number;
  viewsThisMonth: number;
  leadsThisMonth: number;
  conversionRate: number;
  rating: number | null;
  reviewCount: number;
}
