-- Seed launch coupon: WEDDINGPRO
-- 100% discount on free trial (discount_value = 100, type = percentage)
-- Unlimited uses, valid indefinitely
INSERT INTO "coupons" ("id", "code", "discount_type", "discount_value", "max_uses", "used_count", "valid_from", "valid_until", "is_active", "created_at")
VALUES (
  'coupon-weddingpro-launch',
  'WEDDINGPRO',
  'percentage',
  100,
  NULL,
  0,
  '2026-01-01 00:00:00',
  NULL,
  true,
  now()
) ON CONFLICT ("code") DO NOTHING;
