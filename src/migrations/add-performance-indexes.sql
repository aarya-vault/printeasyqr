-- Performance indexes for order queue optimization
-- These indexes will dramatically speed up order number calculations

-- Index for fast active order lookup
CREATE INDEX IF NOT EXISTS idx_orders_shop_status 
ON orders("shopId", status, "deletedAt");

-- Index for fast order number sorting
CREATE INDEX IF NOT EXISTS idx_orders_shop_number 
ON orders("shopId", "orderNumber" DESC);

-- Index for user phone lookup (for JIT auth)
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone);

-- Index for shop slug lookup
CREATE INDEX IF NOT EXISTS idx_shops_slug 
ON shops(slug);
