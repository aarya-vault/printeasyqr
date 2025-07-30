# Comprehensive Shop Application Data & System Integration Documentation

## Shop Application Data Collection Schema

### Database Schema (shop_applications table)
Located in `shared/schema.ts` - Complete data structure for shop applications:

#### Public Information (Customer-Facing)
- **publicShopName**: Shop name visible to customers
- **publicOwnerName**: Owner name shown in customer chats (e.g., "Mr. Rajesh")
- **publicAddress**: Address displayed to customers
- **publicContactNumber**: Phone number customers can call (mandatory)

#### Internal Shop Details (Business Information)
- **internalShopName**: Internal business name
- **ownerFullName**: Complete owner name for records
- **email**: Login email for shop owner authentication
- **phoneNumber**: Owner's contact number (internal)
- **password**: Hashed password for shop owner login
- **completeAddress**: Detailed address (made nullable per requirements)

#### Location Data
- **city**: Shop city
- **state**: Shop state  
- **pinCode**: Postal code

#### Business Details
- **services**: JSONB array of services offered
- **customServices**: JSONB array of up to 10 custom services
- **equipment**: JSONB array of equipment available
- **customEquipment**: JSONB array of up to 10 custom equipment items
- **yearsOfExperience**: Dropdown selection (1-30 years)

#### Working Hours & Settings
- **workingHours**: JSONB object with day-wise schedule
  ```json
  {
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    // ... for all 7 days
  }
  ```
- **acceptsWalkinOrders**: Boolean for walk-in order acceptance

#### Application Management
- **shopSlug**: Unique URL slug for SEO-friendly shop URLs
- **status**: "pending", "approved", "rejected"
- **adminNotes**: Admin comments and notes
- **createdAt**: Application submission timestamp
- **updatedAt**: Last modification timestamp

## Application Form Implementation

### Current Form (simple-shop-application.tsx)
Located in `client/src/components/simple-shop-application.tsx`

#### Form Structure:
1. **Public Information Section**
   - Public Shop Name (required)
   - Public Name (required - for customer chat display)
   - Public Address (required)
   - Public Contact Number (required - for customer calls)
   - Shop Slug (unique, with real-time availability checking)

2. **Contact Details Section**
   - Owner Full Name (required)
   - Email (required - login credential)
   - Owner Contact Number (required - 10-digit validation)
   - Password (required - minimum 6 characters)
   - Confirm Password (required)
   - City, State, Pin Code (all required)

3. **Business Details Section**
   - Years of Experience (dropdown 1-30 years)
   - Services Offered (checkbox array, minimum 1)
   - Custom Services (up to 10 custom entries)
   - Equipment Available (checkbox array, minimum 1)
   - Custom Equipment (up to 10 custom entries)

4. **Working Hours Section**
   - Day-wise schedule (Monday-Sunday)
   - Open/Close times for each day
   - Closed day toggle option
   - Accepts Walk-in Orders toggle

#### Service Options Available:
```javascript
'Color Printing', 'B&W Printing', 'Photocopying', 'Scanning', 'Binding', 
'Lamination', 'ID Card Printing', 'Photo Printing', 'Banner Printing', 
'T-Shirt Printing', 'Mug Printing'
```

#### Equipment Options Available:
```javascript
'HP LaserJet Pro', 'Canon ImageRunner', 'Xerox WorkCentre', 'Epson EcoTank', 
'Brother MFC', 'Binding Machine', 'Lamination Machine', 'Large Format Printer', 
'ID Card Printer', 'Heat Press Machine'
```

## Admin Panel Integration

### Shop Application Management
Located in admin dashboard with comprehensive editing capabilities:

#### Admin Features:
1. **Complete Application View**
   - Tabbed interface: Public Info, Internal Info, Credentials, Business Details, Admin Notes
   - All application data visible and editable
   - Status management (pending/approved/rejected)
   - Admin notes for internal communication

2. **Full Editing Capabilities**
   - Admin can edit ALL shop details including passwords
   - Working hours modification
   - Services and equipment updates
   - Business information changes
   - Shop settings control

3. **Shop Settings Control**
   - Walk-in order acceptance toggle
   - Working hours management
   - Availability configuration
   - Auto turn-off when shop hours end

## Shop Owner Settings Integration

### Shop Settings Page
Shop owners can manage their information through dedicated settings page:

#### Editable Fields:
1. **Business Information**
   - Shop name and description
   - Contact information
   - Address details

2. **Working Hours Configuration**
   - Weekly schedule management
   - Open/close times
   - Closed days setting
   - Real-time availability calculation

3. **Order Settings**
   - Walk-in order acceptance
   - Auto-availability based on current time
   - Order processing preferences

4. **Account Management**
   - Email updates
   - Password changes
   - Contact information updates

## System Integration Points

### Authentication System
- **Shop Owner Login**: Email/password captured during application
- **Session Management**: Server-side sessions with bcrypt verification
- **Role-based Access**: Proper separation of shop owner and admin functions

### Database Storage Methods
- `createShopApplication()`: Store complete application data
- `updateShopApplication()`: Admin and shop owner updates
- `getShopApplication()`: Retrieve application details
- `approveShopApplication()`: Convert application to active shop

### API Endpoints
- `POST /api/shop-applications`: Submit new application
- `PATCH /api/shop-applications/:id`: Update application (admin)
- `PATCH /api/shops/settings`: Update shop settings (shop owner)
- `GET /api/shop-applications`: List all applications (admin)

### Validation & Security
- **Real-time Slug Validation**: Checks uniqueness during form entry
- **Password Security**: Bcrypt hashing with salt rounds of 12
- **Input Validation**: Comprehensive Zod schemas for all fields
- **Role-based Authorization**: Proper access control for different user types

## Test Data Implementation

### Working Shop Application
Created complete test shop with real data:
- **Shop Owner**: quickprint@example.com / password123 (ID: 37)
- **Shop**: QuickPrint Solutions with full business details
- **Customer**: 9876543211 (Test Customer)
- **Admin**: admin@printeasy.com / admin123

### Complete Workflow Testing
1. Shop Application → 2. Admin Review → 3. Approval → 4. Shop Dashboard Access → 5. Settings Management → 6. Order Processing → 7. Customer Interaction

## Key Features Achieved

### Comprehensive Data Collection
- All business information captured in single application
- Public vs internal information separation
- Complete contact and credential collection
- Detailed business capabilities documentation

### Unified Admin Control
- Complete application review system
- Full editing capabilities for all shop data
- Status management and approval workflow
- Settings override capabilities

### Shop Owner Self-Management
- Settings page for business information updates
- Working hours management
- Order acceptance configuration
- Account credential management

### Production-Ready Implementation
- Secure password handling
- Real-time validation
- Complete error handling
- Mobile-responsive design
- Consistent branding (golden yellow #FFBF00 and black)

This documentation covers the complete shop application data structure and its integration across admin panel and shop settings, providing a comprehensive overview of how all collected information is managed throughout the system.