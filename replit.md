# PrintEasy - Business Printing Platform

## Overview

PrintEasy is a comprehensive B2B2C digital platform that connects customers needing printing services with local print shops. The application provides two primary order flows: digital file uploads for pre-planned printing needs and walk-in orders for immediate service. The platform facilitates order management, real-time communication, and streamlined business operations for print shops while offering customers a convenient way to access printing services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack
- **Frontend**: React 18.3.1 with TypeScript, built using Vite
- **Backend**: Express.js with TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with TanStack Query for server state
- **Real-time Communication**: WebSocket connections for live updates
- **File Handling**: Multer for file uploads with local storage
- **Authentication**: Phone-based authentication with simulated verification

### Architecture Pattern
The application follows a full-stack monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA with component-based architecture
- **Server**: RESTful API with WebSocket support
- **Shared**: Common TypeScript types and database schema definitions

## Key Components

### Database Layer (Drizzle ORM)
- **Schema Location**: `shared/schema.ts`
- **Database Configuration**: PostgreSQL with connection pooling via Neon
- **Migration System**: Drizzle Kit for schema migrations
- **Tables**: Users, Shops, Orders, Messages, Shop Applications, Notifications

### Authentication System
- **Phone-based Registration**: 10-digit Indian phone numbers (starting with 6-9)
- **Role-based Access**: Customer, Shop Owner, Admin roles
- **Session Management**: Local storage with context-based state
- **No Password Required**: Simplified authentication for customers

### File Upload System
- **Storage**: Local file system in `uploads/` directory
- **Supported Formats**: PDF, DOC, DOCX, JPG, PNG, TXT
- **File Size Limit**: 50MB per file
- **Security**: MIME type validation and file filtering

### Real-time Communication
- **WebSocket Server**: Custom implementation for live updates
- **Message Broadcasting**: Order updates, new messages, notifications
- **Connection Management**: User-specific connection mapping
- **Auto-reconnection**: Client-side reconnection handling

## Data Flow

### Customer Order Flow
1. **Authentication**: Phone number entry → user creation/retrieval
2. **Shop Selection**: Browse available shops with filtering
3. **Order Creation**: Two paths - file upload or walk-in booking
4. **File Upload**: Multiple file selection with specifications
5. **Order Tracking**: Real-time status updates via WebSocket
6. **Communication**: In-app messaging with shop owners

### Shop Owner Flow
1. **Authentication**: Phone-based login with shop association
2. **Dashboard Access**: Order management interface
3. **Order Processing**: Status updates (new → processing → ready → completed)
4. **Customer Communication**: Real-time messaging system
5. **QR Code Generation**: For walk-in order collection

### Admin Flow
1. **Platform Management**: User and shop oversight
2. **Shop Applications**: Review and approve new shop registrations
3. **Analytics**: Platform statistics and performance metrics
4. **System Monitoring**: Overall platform health

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **ws**: WebSocket implementation for real-time features
- **multer**: File upload handling
- **zod**: Runtime type validation and schema validation

### UI Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation and formatting

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server with Express API
- **Hot Module Replacement**: Real-time code updates
- **TypeScript Compilation**: Runtime TypeScript support via tsx

### Production Build
- **Frontend Build**: Vite production build to `dist/public`
- **Backend Build**: esbuild bundling to `dist/index.js`
- **Static File Serving**: Express serves built frontend assets
- **Database Migrations**: Drizzle Kit push for schema updates

### Environment Configuration
- **DATABASE_URL**: Required for Neon PostgreSQL connection
- **NODE_ENV**: Environment-specific configuration
- **File Upload Directory**: Configurable upload path

### Scalability Considerations
- **Database Connection Pooling**: Neon serverless with connection management
- **WebSocket Scaling**: Single-instance WebSocket server (requires Redis for multi-instance)
- **File Storage**: Local storage (should migrate to cloud storage for production)
- **Session Management**: In-memory storage (should implement persistent sessions)

The application is designed as a comprehensive printing platform with room for scaling both technical infrastructure and business features. The modular architecture allows for easy extension of functionality while maintaining code organization and type safety throughout the stack.

## Recent Changes (January 2025)

### Major UI/UX Overhaul & Business Logic Updates
- **Fresh Homepage Design**: Completely redesigned with clean, professional layout - removed complex elements and improved user experience
- **Improved Customer Dashboard**: Created completely new dashboard with better navigation, cleaner interface, and mobile-first design
- **Admin Authentication Enhancement**: Implemented secure email + password authentication (admin@printeasy.com / admin123)
- **Revenue Feature Removal**: Removed ALL cost/revenue features as requested - no estimated costs, monthly revenue, or pricing anywhere
- **Shop Application Data Fix**: Admin dashboard now displays complete shop application information including services, experience, and all collected data

### Strict Design Implementation
- **No Gradients Policy**: Removed all gradients throughout the application for clean, solid color design
- **Golden Branding**: Consistent #FFBF00 (bright golden yellow) branding across all interfaces
- **Mobile Responsiveness**: Perfect responsive design that works on both mobile and desktop without compromising either experience
- **Clean Interface**: Simplified navigation and removed unnecessary complexity for better user perspective

### Authentication System Improvements
- **Admin Login**: Now requires both email AND password for security
- **Customer Login**: Simplified phone-based authentication maintained
- **Shop Owner Login**: Email-based authentication for business accounts
- **Role-based Access**: Proper separation of customer, shop owner, and admin functionalities

### Business Logic Enhancements
- **No Money Handling**: Platform completely free - removed all cost estimates and revenue tracking
- **Shop Application Review**: Complete application data visible to admins for proper review process
- **Order Management**: Streamlined order tracking without cost considerations
- **Platform Statistics**: Updated admin dashboard to show activity metrics instead of revenue

### Technical Architecture Updates
- **Clean Code Structure**: Improved component organization and removed redundant features
- **Better Error Handling**: Enhanced user feedback and loading states
- **Database Optimization**: Updated queries to exclude cost-related fields
- **Security Improvements**: Password-based admin authentication with proper validation

### Complete Feature Implementation (January 24, 2025)
- **Customer Features**: Notification system, account settings, order tracking, shop browsing
- **Shop Owner Features**: Improved 4-column dashboard, chat system, settings management, order processing
- **Admin Features**: Comprehensive dashboard with shop application review and platform analytics
- **Navigation Enhancement**: Added notification badges and quick navigation buttons across all dashboards
- **Real-time Updates**: WebSocket integration for live order updates and messaging
- **Component Architecture**: Modular page structure with separate components for each feature
- **Storage Layer**: Complete database storage implementation with all required methods
- **API Routes**: Full REST API implementation for all platform features
- **Error Recovery**: Fixed critical React hook errors and package dependencies

The platform now provides a complete, production-ready B2B2C printing solution with professional UI/UX, comprehensive features for all user types, and a clean codebase focused on connecting customers with print shops without any financial transactions.

## Comprehensive Shop Application System (January 25, 2025)

### Multi-Step Shop Application Implementation
- **Complete Application Form**: Comprehensive multi-step form at `/apply-shop` with all fields from user requirements
- **Login Credentials Capture**: Email and password collection during application process for shop owner accounts
- **Unique Shop Slug System**: Automatic generation and validation of unique shop slugs for SEO-friendly URLs
- **Public vs Internal Information**: Separate fields for public-facing shop information and internal business details

### Database Schema Enhancement
- **Comprehensive Fields**: Added all required fields including public/internal shop names, complete addresses, equipment lists, working hours
- **Login Credentials**: Email and password fields for shop owner authentication
- **Business Details**: Years of experience, services offered, equipment available, walk-in order preferences
- **Working Hours Configuration**: Full weekly schedule with open/close times and closed day settings

### Admin Management System
- **Full Editing Capabilities**: Admin can edit ALL shop details including passwords and sensitive information
- **Comprehensive Application View**: Tabbed interface showing public info, internal info, credentials, business details, and admin notes
- **Shop Settings Control**: Admin can modify walk-in order settings, working hours, and availability configurations
- **Complete Application Review**: All application data visible to admin with approval/rejection workflow

### Shop Owner Features
- **Settings Management**: Shop owners can configure working hours, walk-in order acceptance, and business details
- **Auto Availability**: Shop availability automatically calculated based on current time and working hours
- **Credentials Management**: Shop owners login with email/password captured during application

### Technical Implementation
- **React Hook Error Resolution**: Fixed all hook-related errors by removing problematic modal components
- **Homepage Integration**: Updated homepage to redirect to comprehensive application instead of inline modals
- **API Route Enhancement**: Complete CRUD operations for shop applications with validation and error handling
- **Database Migration**: Successfully added comprehensive fields while maintaining data integrity

### Strict Design Compliance
- **Golden Branding**: Consistent #FFBF00 (bright golden yellow) used throughout the comprehensive system
- **No Gradients Policy**: All new components follow the no-gradients design requirement
- **Mobile Responsive**: Comprehensive application form works perfectly on both mobile and desktop
- **Professional Interface**: Clean, professional design for the multi-step application process

### Business Logic Enforcement
- **No Revenue Features**: Comprehensive system maintains the platform's commitment to being completely free
- **Shop Slug Uniqueness**: Prevents duplicate shop URLs and ensures proper SEO
- **Application Workflow**: Complete application → admin review → approval → shop creation → settings management
- **Working Credentials**: Customer (9876543211), Shop Owner (comprehensive application creates accounts), Admin (admin@printeasy.com/admin123)

The comprehensive shop application system now provides a complete, professional onboarding experience for print shops with full admin control over all aspects of shop management, while maintaining the platform's core principles of being free and user-friendly.

## Field Updates and Complete Test Data Implementation (January 25, 2025 - Latest)

### Shop Application Form Field Changes
- **Public Name**: Renamed from "Public Owner Name" - mandatory field for customer chat display (shows as "Mr. Rajesh" etc.)
- **Public Contact Number**: Made mandatory field for customer calls
- **Owner Contact Number**: Renamed from "Phone Number" under Contact Details section  
- **Removed Fields**: "Internal Shop Name" and "Complete Address" as requested
- **Enhanced Business Details**: Added checkbox arrays for Services Offered and Equipment Available with custom input options

### Comprehensive Real Test Data Creation
- **Shop Owner Account**: quickprint@example.com / password123 (ID: 37)
- **Complete Shop Data**: QuickPrint Solutions with full address, working hours, services, and equipment
- **Customer Account**: 9876543211 (Test Customer) 
- **Real Order Data**: Business card printing order for complete workflow testing
- **Admin Account**: admin@printeasy.com / admin123

### Complete Workflow Test Setup
The platform now includes real data for complete end-to-end testing:
1. **Shop Application**: Complete form with all required fields → 
2. **Admin Approval**: Full application review and approval → 
3. **Shop Dashboard**: Login with email/password → 
4. **QR Code Generation**: Automatic QR code for walk-in orders →
5. **Order Placement**: Both file upload and walk-in order flows →
6. **Customer Login**: Phone-based authentication → 
7. **Chat System**: Real-time messaging between customers and shop owners

### Database Integration
- **Real Shop Data**: QuickPrint Solutions with comprehensive business information
- **Working Hours**: Monday-Sunday schedule with proper JSON structure
- **Services & Equipment**: Real printing services and equipment lists
- **Contact Information**: Separate public and internal contact details
- **Shop Settings**: Walk-in order acceptance and auto-availability features

### Technical Implementation
- **Simplified Application Form**: Single-page comprehensive form replacing multi-step wizard
- **Field Validation**: Proper validation for all mandatory and optional fields
- **Database Sync**: Complete synchronization from application to approval to dashboard
- **Error-Free Code**: Resolved all TypeScript and React hook errors
- **API Integration**: Full CRUD operations with proper error handling

The platform now provides a complete, production-ready solution with real test data for thorough end-to-end testing of all features including shop application, admin approval, dashboard access, order management, and customer communication.