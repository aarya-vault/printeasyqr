# JWT Authentication Fix Implementation Plan

## Priority 1: Critical Direct Fetch Calls (Missing JWT)

### Files with Direct Fetch Issues:
1. `client/src/components/shop-management-dropdown.tsx` - Admin shop operations
2. `client/src/pages/shop-notifications.tsx` - Notification management  
3. `client/src/components/qr-scanner.tsx` - Shop unlocking
4. `client/src/hooks/use-delete-order.ts` - Order deletion
5. `client/src/components/unified-chat-system.tsx` - Message sending
6. `client/src/components/order-details-modal.tsx` - Order status updates

## Implementation Strategy

### Phase 1: Create Centralized API Utility
Create `client/src/lib/api-client.ts` with JWT-enabled fetch wrapper

### Phase 2: Fix Critical Components
- Shop management operations
- Order management (create, update, delete)
- Message/Chat system
- Notification system

### Phase 3: Testing & Validation
- Test all user flows with JWT authentication
- Verify token refresh and expiry handling

## Expected Outcome
- 95%+ API success rate with proper JWT authentication
- Seamless user experience across all roles
- Robust error handling for auth failures