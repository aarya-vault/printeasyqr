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

The platform now provides a completely free, user-friendly B2B2C solution with professional UI/UX focused on connecting customers with print shops without any financial transactions.