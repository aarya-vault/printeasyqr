# PrintEasy QR - Application Route Map

## Main Router Analysis
Router Location: `client/src/App.tsx` (Uses Wouter library, not React Router)

## Application Route Map

| URL Path                        | Component File Path                              | Component Name                     | Notes                                                    |
|--------------------------------|--------------------------------------------------|------------------------------------|---------------------------------------------------------|
| `/`                            | `client/src/pages/new-homepage.tsx`             | NewHomepage                       | **ACTIVE HOMEPAGE** - Main landing page                |
| `/customer-dashboard`          | `client/src/pages/unified-customer-dashboard.tsx` | UnifiedCustomerDashboard         | Customer main dashboard                                 |
| `/unified-customer-dashboard`  | `client/src/pages/unified-customer-dashboard.tsx` | UnifiedCustomerDashboard         | **DUPLICATE ROUTE** - Same as above                    |
| `/customer-notifications`     | `client/src/pages/customer-notifications.tsx`    | CustomerNotifications            | Customer notification center                            |
| `/customer-account-settings`  | `client/src/pages/customer-account-settings.tsx` | CustomerAccountSettings          | Customer profile settings                               |
| `/customer-account`           | `client/src/pages/customer-account.tsx`          | CustomerAccount                  | Customer account overview                               |
| `/customer-orders`            | `client/src/pages/customer-orders.tsx`           | CustomerOrders                   | Customer order history                                  |
| `/customer-visited-shops`     | `client/src/pages/customer-visited-shops.tsx`    | CustomerVisitedShops             | Shows shops customer has visited                        |
| `/browse-shops`               | `client/src/pages/browse-shops.tsx`              | BrowseShops                      | Public shop browsing (no auth required)               |
| `/customer-browse-shops`      | `client/src/pages/customer-browse-shops.tsx`     | CustomerBrowseShops              | **DUPLICATE** - Customer-specific shop browsing        |
| `/shop-dashboard`             | `client/src/pages/redesigned-shop-owner-dashboard.tsx` | RedesignedShopOwnerDashboard | **ACTIVE SHOP DASHBOARD** - Main shop owner interface |
| `/shop-order-history`         | `client/src/pages/shop-order-history.tsx`        | ShopOrderHistory                 | Shop owner order history                               |
| `/shop-dashboard/orders/:orderId` | `client/src/pages/shop-order-details.tsx`     | ShopOrderDetails                 | **ACTIVE ORDER DETAILS PAGE** - Individual order view |
| `/shop-settings`              | `client/src/pages/redesigned-shop-settings.tsx`  | RedesignedShopSettings           | Shop configuration and settings                        |
| `/admin-dashboard`            | `client/src/pages/enhanced-admin-dashboard.tsx`   | EnhancedAdminDashboard           | **ACTIVE ADMIN DASHBOARD** - Admin control panel      |
| `/admin-login`                | `client/src/components/auth/admin-login.tsx`      | AdminLogin                       | Admin authentication                                   |
| `/shop-login`                 | `client/src/pages/shop-login.tsx`                 | ShopLoginPage                    | Shop owner authentication                              |
| `/apply-shop`                 | `client/src/pages/comprehensive-application.tsx`  | ComprehensiveApplicationPage     | Shop application form                                  |
| `/shop/:slug`                 | `client/src/pages/shop-order.tsx`                 | ShopOrder                        | **PUBLIC SHOP PAGE** - Order placement interface      |
| `/order-confirmation/:orderId` | `client/src/pages/order-confirmation.tsx`        | OrderConfirmation                | Order success page                                     |
| `/shop-notifications`         | `client/src/pages/shop-notifications.tsx`         | ShopNotifications                | Shop owner notifications                               |
| `/pincode-test`               | `client/src/pages/pincode-test.tsx`               | PincodeTestPage                  | **DEVELOPMENT TOOL** - Pincode testing                |
| `/otp-demo`                   | `client/src/pages/otp-demo.tsx`                   | OTPDemo                          | **DEVELOPMENT TOOL** - OTP testing                    |
| `*` (404 fallback)            | `client/src/pages/not-found.tsx`                  | NotFound                         | 404 error page                                         |

---

## Redundant / Unused Route-Related Files Found

### Duplicate Homepage Implementations
* `client/src/pages/redesigned-homepage.tsx` - **UNUSED** (RedesignedHomepage)
* ~~`client/src/pages/old-homepage.tsx`~~ - Not found, likely cleaned up

### Duplicate Dashboard Components  
* `client/src/pages/shop-settings.tsx` - **UNUSED** (Original ShopSettings)
* `client/src/pages/enhanced-shop-settings.tsx` - **UNUSED** (EnhancedShopSettings)

### Unused Administrative Pages
* `client/src/pages/complete-admin-shop-edit.tsx` - **UNUSED** (CompleteAdminShopEdit)

### Development/Testing Pages (May be intentionally kept)
* `client/src/pages/pincode-test.tsx` - Development utility
* `client/src/pages/otp-demo.tsx` - Development utility

---

## Order Detail Component Analysis

### MULTIPLE ORDER DETAIL IMPLEMENTATIONS FOUND:

#### 1. **ACTIVE**: Shop Order Details Page
- **File**: `client/src/pages/shop-order-details.tsx`
- **Route**: `/shop-dashboard/orders/:orderId`
- **Purpose**: Full-page order details for shop owners
- **Features**: Print all, download all, customer contact, status management

#### 2. **MODAL**: Enhanced Customer Order Details
- **File**: `client/src/components/enhanced-customer-order-details.tsx`
- **Route**: Used as modal component (no direct route)
- **Purpose**: Modal popup for customer order viewing
- **Features**: Advanced with stable state management, file upload, real-time updates

#### 3. **MODAL**: Generic Order Details Modal
- **File**: `client/src/components/order-details-modal.tsx`
- **Route**: Used as modal component (no direct route)
- **Purpose**: Shared modal for both customers and shop owners
- **Features**: Basic order viewing with edit capabilities

**ARCHITECTURAL ISSUE**: Three different implementations doing similar things!

---

## Authentication Flow Analysis

### Active Authentication Routes:
- `/shop-login` → Shop Owner Login
- `/admin-login` → Admin Login  
- **No dedicated customer login route** - Uses modal system

### Authentication Components Found:
- `client/src/components/auth/phone-login.tsx` - **ACTIVE** Customer phone auth
- `client/src/components/auth/shop-owner-login.tsx` - **ACTIVE** Shop owner auth
- `client/src/components/auth/admin-login.tsx` - **ACTIVE** Admin auth
- `client/src/components/auth/otp-verification-modal.tsx` - **ACTIVE** WhatsApp OTP (currently bypassed)
- `client/src/components/auth/name-collection-modal.tsx` - **ACTIVE** New customer name input

---

## Navigation Structure Analysis

### Customer Flow:
1. `/` (Homepage) → Phone login modal → `/customer-dashboard`
2. Customer Dashboard → Various customer pages
3. QR Scan → `/shop/:slug` → Order placement

### Shop Owner Flow:
1. `/shop-login` → `/shop-dashboard` 
2. Shop Dashboard → Order management → `/shop-dashboard/orders/:orderId`

### Admin Flow:
1. `/admin-login` → `/admin-dashboard`
2. Admin Dashboard → Full system management

---

## Key Findings:

### ✅ What's Working:
- Main routing structure is functional
- Authentication flows are properly implemented
- Order placement and management work end-to-end

### ⚠️ Issues Found:
1. **Duplicate Routes**: `/customer-dashboard` and `/unified-customer-dashboard` point to same component
2. **Multiple Order Components**: 3 different order detail implementations
3. **Unused Shop Browse**: Both `/browse-shops` and `/customer-browse-shops` exist
4. **Development Routes in Production**: `/pincode-test` and `/otp-demo` accessible

### 🔧 Recommended Cleanup:
1. Remove duplicate route: `/unified-customer-dashboard`
2. Consolidate order detail components into single implementation
3. Remove or protect development routes
4. Archive unused dashboard components

---

## Component Redundancy Summary:

**Total Route-Connected Components**: 25
**Redundant/Unused Components**: 8+
**Development-Only Routes**: 2

The core routing structure works, but architectural cleanup is needed to remove redundancy and improve maintainability.