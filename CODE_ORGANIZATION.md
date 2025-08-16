# PrintEasy QR - Code Organization & Best Practices
*Updated: December 2024*

## 📁 Project Structure Overview

```
PrintEasy QR/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui base components
│   │   │   ├── unified-order-card.tsx
│   │   │   ├── order-details-modal.tsx
│   │   │   └── enhanced-file-upload.tsx
│   │   ├── pages/             # Route components
│   │   │   ├── shop-order.tsx # Order creation flow
│   │   │   ├── redesigned-shop-owner-dashboard.tsx
│   │   │   └── customer-dashboard.tsx
│   │   ├── contexts/          # React contexts
│   │   │   └── auth-context.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── use-auth.ts
│   │   │   └── use-delete-order.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── shop-timing.ts
│   │   │   ├── print-helpers.ts
│   │   │   └── direct-upload.ts
│   │   └── lib/               # Library configurations
│   │       └── queryClient.ts
├── server/                     # Backend Infrastructure
│   ├── storage/               # Storage management
│   │   └── storageManager.js
│   └── vite.ts               # Vite server setup
├── src/                       # Express Backend
│   ├── controllers/           # Business logic
│   │   ├── order.controller.js # Order management & ID generation
│   │   ├── auth.controller.js  # Authentication logic
│   │   └── shop.controller.js  # Shop management
│   ├── models/               # Database models
│   │   ├── Order.js          # Enhanced with publicId
│   │   ├── User.js           # User authentication
│   │   └── Shop.js           # Shop data
│   ├── routes/               # API routes
│   │   ├── orders.js         # Order endpoints
│   │   ├── auth.js           # Auth endpoints
│   │   └── shops.js          # Shop endpoints
│   ├── middleware/           # Express middleware
│   │   ├── auth.js           # JWT verification
│   │   └── upload.js         # File upload handling
│   ├── utils/                # Backend utilities
│   │   ├── websocket.js      # Real-time communication
│   │   └── objectStorageUpload.js
│   └── config/               # Configuration
│       ├── database.js       # Database connection
│       └── jwt-auth.js       # JWT configuration
├── shared/                    # Shared code
│   └── types.ts              # TypeScript definitions
├── TECHNICAL_DOCUMENTATION.md # Technical docs
├── CODE_ORGANIZATION.md      # This file
└── replit.md                 # Project overview
```

## 🎯 Key Design Patterns

### 1. Dual ID System Pattern
```javascript
// Controller Layer - ID Generation
class OrderController {
  static generatePublicId() {
    // Generate random alphanumeric ID for external use
  }
  
  static transformOrderData(order) {
    // Standardize order data with both ID types
    return {
      id: orderData.id,           // Internal sequential ID
      publicId: orderData.publicId // External random ID
    };
  }
}

// Frontend - Conditional Display
const displayId = order.publicId || order.id;
const queueNumber = order.orderNumber;
```

### 2. Queue Number Management Pattern
```javascript
// Smart queue calculation considering only active orders
static async calculateDynamicQueueNumber(shopId) {
  const activeOrders = await Order.findAll({
    where: {
      shopId,
      status: { [Op.in]: ['new', 'pending', 'processing', 'ready'] },
      deletedAt: { [Op.is]: null }
    }
  });
  
  // Auto-reset when queue is empty
  if (activeOrders.length === 0) return 1;
  
  // Increment from highest active number
  const highest = Math.max(...activeOrders.map(o => o.orderNumber || 0));
  return highest + 1;
}
```

### 3. JWT Authentication Pattern
```javascript
// Just-in-Time Authentication
// Frontend: shop-order.tsx
const authResponse = await fetch('/api/auth/just-in-time', {
  method: 'POST',
  body: JSON.stringify({ name, phone })
});

// Store token immediately for dashboard access
localStorage.setItem('token', authData.token);

// Backend: Automatic user creation/lookup
const [customer, created] = await User.findOrCreate({
  where: { phone },
  defaults: { name, role: 'customer' }
});

const token = generateToken(customer.toJSON());
```

## 🧩 Component Architecture

### Unified Components Pattern
All order-related components follow a unified interface for consistency:

```typescript
// UnifiedOrderCard - Single component for all user types
interface UnifiedOrderCardProps {
  order: Order;
  userRole: 'customer' | 'shop_owner';
  onChatClick: (orderId: number) => void;
  onViewDetails?: (order: Order) => void;
  showActions?: boolean;
}

// Role-based display logic
const displayName = userRole === 'customer' 
  ? order.shop?.name 
  : order.customer?.name;
```

### Modal Management Pattern
```typescript
// Centralized modal state management
const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
const [selectedOrderForChat, setSelectedOrderForChat] = useState<number | null>(null);

// Stable order data handling to prevent corruption
const orderDetailsData = useMemo(() => {
  return selectedOrderForDetails ? JSON.parse(JSON.stringify(selectedOrderForDetails)) : null;
}, [selectedOrderForDetails]);
```

## 🔄 Data Flow Architecture

### Order Creation Flow
```
1. Frontend (shop-order.tsx)
   ├── Just-in-Time Authentication
   ├── Generate JWT Token
   └── Store User Session

2. Backend (order.controller.js)
   ├── Generate Public ID
   ├── Calculate Queue Number
   ├── Create Order Record
   └── Return Transformed Data

3. Frontend Response
   ├── Display Success Message
   ├── Show Queue Number & Public ID
   └── Navigate to Order Confirmation
```

### Real-time Updates Flow
```
WebSocket Server (port 5000)
├── Order Status Changes
├── Chat Message Updates
├── Queue Number Recalculations
└── Dashboard Notifications

Frontend Subscriptions
├── Customer Dashboard
├── Shop Owner Dashboard
└── Order Details Modal
```

## 📋 Coding Standards

### Naming Conventions
```javascript
// Functions: Descriptive action verbs
calculateDynamicQueueNumber()
generatePublicId()
transformOrderData()

// Variables: Clear, descriptive names
const publicId = OrderController.generatePublicId();
const queueNumber = await OrderController.calculateDynamicQueueNumber(shopId);

// Constants: SCREAMING_SNAKE_CASE
const ORDER_STATUSES = ['new', 'pending', 'processing', 'ready', 'completed'];
const PUBLIC_ID_LENGTH = 7;
```

### Comment Standards
```javascript
// 🆔 PUBLIC ID GENERATION: Clear purpose with emoji
// 🎯 DYNAMIC QUEUE NUMBERING: Business logic explanation
// 🔐 JWT GENERATION: Security-related operations
// 🚀 PERFORMANCE OPTIMIZATION: Speed improvements
// 🔧 FIX: Bug fixes and corrections
```

### Error Handling Pattern
```javascript
// Controller Layer
try {
  const result = await businessLogic();
  return res.json(transformedResult);
} catch (error) {
  console.error('❌ Operation failed:', error);
  res.status(500).json({ 
    message: 'User-friendly error message',
    errorCode: 'SPECIFIC_ERROR_CODE'
  });
}

// Frontend Layer
try {
  const response = await apiCall();
  // Handle success
} catch (error) {
  toast({
    variant: 'destructive',
    title: 'Operation Failed',
    description: error?.message || 'Please try again.'
  });
}
```

## 🗄️ Database Best Practices

### Query Optimization
```javascript
// Include only necessary relations
const orders = await Order.findAll({
  include: [
    { model: User, as: 'customer', attributes: ['id', 'name', 'phone'] },
    { model: Shop, as: 'shop', attributes: ['id', 'name', 'phone'] }
  ],
  where: { shopId, deletedAt: { [Op.is]: null } },
  order: [['createdAt', 'DESC']]
});

// Use indexes for frequent queries
// Index on: publicId, shopId + status, customerId
```

### Data Integrity
```javascript
// Always exclude soft-deleted records
where: {
  shopId,
  status: { [Op.in]: ['new', 'pending', 'processing', 'ready'] },
  deletedAt: { [Op.is]: null }  // Essential for data integrity
}

// Validate required fields
if (!publicId || !customerId || !shopId) {
  throw new Error('Missing required order fields');
}
```

## 🎨 Frontend Standards

### Component Structure
```typescript
// 1. Imports (grouped by type)
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Button } from '@/components/ui';
import { Order } from '@shared/types';

// 2. Types and Interfaces
interface ComponentProps {
  order: Order;
  onAction: (id: number) => void;
}

// 3. Component Definition
export default function ComponentName({ order, onAction }: ComponentProps) {
  // 4. State and hooks
  const [loading, setLoading] = useState(false);
  
  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 6. Event handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  );
}
```

### State Management
```typescript
// Use React Query for server state
const { data: orders, isLoading } = useQuery({
  queryKey: [`/api/orders/shop/${shopId}`],
  enabled: Boolean(shopId),
  refetchInterval: 30000
});

// Use useState for local UI state
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

// Use Auth Context for user state
const { user, login, logout } = useAuth();
```

## 🚀 Performance Guidelines

### Query Optimization
- Use `enabled` conditions for conditional queries
- Implement appropriate `refetchInterval` for real-time data
- Set `staleTime` and `gcTime` for caching strategy
- Include only necessary fields in database queries

### Memory Management
```typescript
// Cleanup effects
useEffect(() => {
  const timer = setInterval(updateTime, 60000);
  return () => clearInterval(timer); // Always cleanup
}, []);

// Memoize expensive calculations
const processedOrders = useMemo(() => {
  return orders.filter(order => order.status === 'active');
}, [orders]);
```

### Bundle Optimization
- Use dynamic imports for large components
- Implement proper code splitting
- Optimize image assets and file sizes
- Use proper TypeScript for better tree shaking

## 🔒 Security Best Practices

### Authentication
```javascript
// Always verify JWT tokens
const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Data Validation
```javascript
// Input validation on all endpoints
const { name, phone } = req.body;
if (!name || !phone) {
  return res.status(400).json({ message: 'Name and phone are required' });
}

// Sanitize phone numbers
const cleanPhone = phone.replace(/\D/g, '');
if (cleanPhone.length !== 10) {
  return res.status(400).json({ message: 'Invalid phone number format' });
}
```

### Environment Security
```bash
# Never expose in client-side code
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url

# Use secure token storage
localStorage.setItem('authToken', token); # OK for development
# Consider httpOnly cookies for production
```

## 🧪 Testing Guidelines

### Component Testing
```typescript
// Test order card display
test('displays queue number correctly', () => {
  const order = { orderNumber: 5, publicId: 'ORD-X7K9M2P' };
  render(<UnifiedOrderCard order={order} userRole="customer" />);
  expect(screen.getByText('Queue #5')).toBeInTheDocument();
});
```

### API Testing
```javascript
// Test public ID generation
test('generates unique public IDs', () => {
  const id1 = OrderController.generatePublicId();
  const id2 = OrderController.generatePublicId();
  
  expect(id1).toMatch(/^ORD-[A-Z0-9]{7}$/);
  expect(id2).toMatch(/^ORD-[A-Z0-9]{7}$/);
  expect(id1).not.toBe(id2);
});
```

## 📝 Documentation Standards

### Code Documentation
```javascript
/**
 * Calculate dynamic queue number for a shop
 * 
 * @param {number} shopId - The shop ID
 * @returns {Promise<number>} Next queue number
 * 
 * Logic:
 * 1. Count active orders (new, pending, processing, ready)
 * 2. Reset to #1 if no active orders exist
 * 3. Increment from highest active order number
 */
static async calculateDynamicQueueNumber(shopId) {
  // Implementation
}
```

### API Documentation
```javascript
/**
 * POST /api/orders/authenticated
 * 
 * Create authenticated order with JWT token
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Body:
 *   shopId: number
 *   type: 'file_upload' | 'walkin'
 *   description: string
 *   specifications: string
 * 
 * Response:
 *   id: number (internal)
 *   publicId: string (external)
 *   orderNumber: number (queue position)
 *   token: string (JWT for dashboard access)
 */
```

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review error logs and fix critical issues
- [ ] Update dependencies and security patches
- [ ] Monitor database performance metrics
- [ ] Clean up unused files and dead code

### Monthly
- [ ] Database cleanup (old soft-deleted records)
- [ ] Performance optimization review
- [ ] Update documentation for new features
- [ ] Review and update environment variables

### Quarterly
- [ ] Complete security audit
- [ ] Database schema optimization
- [ ] Architecture review and refactoring
- [ ] Update technical documentation

---

*This document should be updated whenever significant architectural changes are made to the codebase.*