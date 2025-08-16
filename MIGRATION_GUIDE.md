# PrintEasy QR - Migration Guide
*Version 2.0 - December 2024*

## 🚀 Queue Number & Public ID Migration

### Overview
This guide covers the migration from the old order numbering system to the new queue number system with random public IDs.

## 📋 Pre-Migration Checklist

### Database Backup
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_*.sql | head -10
```

### Environment Verification
```bash
# Required environment variables
echo "JWT_SECRET: $([ -n "$JWT_SECRET" ] && echo "✅ Set" || echo "❌ Missing")"
echo "DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo "✅ Set" || echo "❌ Missing")"
```

## 🗄️ Database Migration Steps

### Step 1: Add Public ID Column
```sql
-- Add publicId column to orders table
ALTER TABLE orders ADD COLUMN public_id VARCHAR(20);

-- Add unique constraint
ALTER TABLE orders ADD CONSTRAINT orders_public_id_unique UNIQUE (public_id);

-- Create index for performance
CREATE INDEX idx_orders_public_id ON orders(public_id);
CREATE INDEX idx_orders_shop_status ON orders(shop_id, status) WHERE deleted_at IS NULL;
```

### Step 2: Generate Public IDs for Existing Orders
```javascript
// Run this script to populate publicId for existing orders
const { Order } = require('./src/models');

async function migrateExistingOrders() {
  console.log('🔄 Starting public ID migration...');
  
  const ordersWithoutPublicId = await Order.findAll({
    where: {
      publicId: { [Op.is]: null }
    }
  });
  
  console.log(`Found ${ordersWithoutPublicId.length} orders without public IDs`);
  
  for (const order of ordersWithoutPublicId) {
    let publicId;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure unique public ID generation
    do {
      publicId = generatePublicId();
      attempts++;
      
      const existing = await Order.findOne({
        where: { publicId }
      });
      
      if (!existing) break;
      
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to generate unique public ID after ${maxAttempts} attempts`);
      }
    } while (attempts < maxAttempts);
    
    await order.update({ publicId });
    console.log(`✅ Order ${order.id} -> ${publicId}`);
  }
  
  console.log('🎉 Migration completed successfully!');
}

function generatePublicId() {
  const prefix = 'ORD';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

// Run migration
migrateExistingOrders().catch(console.error);
```

### Step 3: Verify Migration
```sql
-- Check that all orders have public IDs
SELECT 
  COUNT(*) as total_orders,
  COUNT(public_id) as orders_with_public_id,
  COUNT(*) - COUNT(public_id) as missing_public_ids
FROM orders;

-- Verify uniqueness
SELECT public_id, COUNT(*) 
FROM orders 
WHERE public_id IS NOT NULL 
GROUP BY public_id 
HAVING COUNT(*) > 1;

-- Should return no rows (all public IDs should be unique)
```

## 🔄 Application Deployment

### Step 1: Deploy Backend Changes
```bash
# Deploy backend with new order controller logic
git push origin main

# Wait for deployment to complete
# Verify API endpoints are responding correctly
curl -X GET "https://your-app.replit.app/api/health"
```

### Step 2: Run Database Migration
```bash
# Run the public ID migration script
node migrate-public-ids.js

# Verify migration success
echo "SELECT COUNT(*) FROM orders WHERE public_id IS NULL;" | psql $DATABASE_URL
```

### Step 3: Deploy Frontend Changes
```bash
# Frontend automatically updates with new terminology
# No additional deployment steps required
# Verify queue numbers are displaying correctly
```

## 🧪 Post-Migration Testing

### API Testing
```bash
# Test order creation with new public ID
curl -X POST "https://your-app.replit.app/api/orders/authenticated" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": 1,
    "type": "file_upload",
    "description": "Test order"
  }'

# Expected response should include both id and publicId
# {
#   "id": 123,
#   "publicId": "ORD-X7K9M2P",
#   "orderNumber": 1,
#   ...
# }
```

### Frontend Testing
```javascript
// Test queue number display
// 1. Create a new order
// 2. Verify success message shows: "Queue #1 (ID: ORD-X7K9M2P)"
// 3. Check order card shows: "Queue #1"
// 4. Verify order details modal shows both IDs correctly
```

### Database Integrity
```sql
-- Verify queue number calculation
SELECT 
  shop_id,
  COUNT(*) as active_orders,
  MAX(order_number) as highest_queue_number
FROM orders 
WHERE status IN ('new', 'pending', 'processing', 'ready')
  AND deleted_at IS NULL
GROUP BY shop_id
ORDER BY shop_id;
```

## 🔧 Rollback Plan

### Emergency Rollback (if issues occur)
```bash
# 1. Revert to previous application version
git revert HEAD --no-edit
git push origin main

# 2. Database rollback (only if necessary)
# Remove public_id column (DESTRUCTIVE - only if critical issues)
# ALTER TABLE orders DROP COLUMN public_id;

# 3. Clear cached data
# Clear browser localStorage
# Restart application servers
```

### Partial Rollback (keep data, revert code)
```bash
# Keep database changes but revert application logic
git revert <specific-commit-hash> --no-edit

# Update frontend to fall back to old ID display
# Keep publicId column for future use
```

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
```javascript
// 1. Public ID Generation Success Rate
// Should be 100% - monitor for any failures

// 2. Queue Number Calculation Performance
// Should complete within 100ms

// 3. Database Query Performance
// Monitor order retrieval times

// 4. JWT Token Generation Success
// Monitor authentication flow completion
```

### Alert Conditions
```javascript
// Set up alerts for:
// - Public ID generation failures
// - Duplicate public ID attempts
// - Queue number calculation errors
// - JWT authentication failures
// - Database connection issues
```

## 🐛 Common Issues & Solutions

### Issue: Missing Public IDs
**Symptoms**: Orders showing undefined publicId in frontend
**Solution**:
```javascript
// Re-run migration script for affected orders
const affectedOrders = await Order.findAll({
  where: { publicId: { [Op.is]: null } }
});

for (const order of affectedOrders) {
  await order.update({
    publicId: generatePublicId()
  });
}
```

### Issue: Queue Numbers Not Resetting
**Symptoms**: Queue continues from high numbers instead of resetting to 1
**Solution**:
```javascript
// Check active order calculation logic
const activeOrders = await Order.findAll({
  where: {
    shopId,
    status: { [Op.in]: ['new', 'pending', 'processing', 'ready'] },
    deletedAt: { [Op.is]: null }  // This is crucial
  }
});

// Ensure deletedAt filter is properly applied
```

### Issue: JWT Token Not Generated
**Symptoms**: Users can't access dashboard after order creation
**Solution**:
```javascript
// Verify JWT_SECRET environment variable
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// Check token generation in order creation
const token = generateToken(customer.toJSON());
if (!token) {
  throw new Error('Failed to generate JWT token');
}
```

### Issue: Duplicate Public IDs
**Symptoms**: Database constraint violations on publicId
**Solution**:
```javascript
// Implement retry logic with uniqueness check
async function generateUniquePublicId() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const publicId = generatePublicId();
    
    const existing = await Order.findOne({
      where: { publicId }
    });
    
    if (!existing) {
      return publicId;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique public ID');
}
```

## 📈 Performance Optimization

### Database Indexing
```sql
-- Ensure proper indexes are in place
CREATE INDEX CONCURRENTLY idx_orders_shop_status_active 
  ON orders(shop_id, status) 
  WHERE deleted_at IS NULL AND status IN ('new', 'pending', 'processing', 'ready');

CREATE INDEX CONCURRENTLY idx_orders_customer_active 
  ON orders(customer_id, status) 
  WHERE deleted_at IS NULL;
```

### Query Optimization
```javascript
// Use efficient queries for order retrieval
const orders = await Order.findAll({
  attributes: ['id', 'publicId', 'orderNumber', 'status', 'createdAt'],
  include: [
    {
      model: User,
      as: 'customer',
      attributes: ['id', 'name', 'phone']
    }
  ],
  where: {
    shopId,
    deletedAt: { [Op.is]: null }
  },
  order: [['createdAt', 'DESC']],
  limit: 50 // Pagination for large datasets
});
```

## ✅ Success Criteria

Migration is considered successful when:

- [ ] All existing orders have unique public IDs
- [ ] New orders generate both sequential ID and random public ID
- [ ] Queue numbers reset properly when shops have no active orders
- [ ] Frontend displays "Queue #" terminology consistently
- [ ] JWT tokens generate successfully for anonymous orders
- [ ] Database performance remains optimal
- [ ] No data loss or corruption
- [ ] User experience is seamless

## 📞 Support & Escalation

### Immediate Issues
1. Check application logs for error details
2. Verify database connectivity
3. Confirm environment variables are set
4. Test API endpoints manually

### Critical Issues
1. Contact technical lead immediately
2. Implement rollback plan if necessary
3. Document issue details for post-mortem
4. Monitor user impact and communication

---

*This migration guide should be reviewed and updated for each major release.*