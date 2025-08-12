# PrintEasy QR - Business Printing Platform

## Overview

PrintEasy QR is a production-ready B2B2C digital platform connecting customers with local print shops. Its main purpose is to streamline order management and communication for print shops while offering customers convenient access to printing services through two primary order flows: digital file uploads for pre-planned needs and walk-in orders for immediate service. The platform features robust admin management and a revolutionary QR generation system, focusing on connecting users without handling financial transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Design Philosophy
The platform adheres to a strict design policy centered around golden yellow (`#FFBF00`) and black, with a "no gradients" rule to ensure a clean, professional, and consistent visual identity. All UI elements comply with this color scheme. The design prioritizes mobile-first responsiveness, scaling elegantly across various device sizes.

### Technology Stack
- **Frontend**: React 18.3.1 with TypeScript (Vite), Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Express.js with Sequelize ORM.
- **Database**: PostgreSQL with Sequelize ORM.
- **Real-time**: WebSocket connections.
- **File Handling**: Multer for local storage file uploads.
- **State Management**: React Context API, TanStack Query.
- **Authentication**: Pure JWT tokens.
- **Development Server**: Vite development server (port 5000 on Replit, defaults to 3001 elsewhere).
- **Deployment**: Netlify with serverless functions.

### Architectural Patterns
- **Monorepo Structure**: Clear separation between client, server, and shared code.
- **Component-Based UI**: Reusable and modular React components.
- **RESTful API with WebSockets**: For data exchange and real-time updates.
- **Clean Architecture**: Minimized technical debt, unified components across dashboards (Customer, Shop Owner, Admin).
- **Role-Based Access Control**: Differentiated functionalities for Customer, Shop Owner, and Admin roles.

### Core Features & Implementations
- **Revolutionary QR Generation**: Hybrid microservice architecture leveraging Vercel serverless functions for primary generation and Puppeteer-core as a fallback. Generates unique, branded QR codes for each shop, enabling automatic shop unlocking and direct order page redirection.
- **Order Flows**: Supports digital file upload and walk-in order booking.
- **Unified Chat System**: Handles all customer-shop owner communications, including file attachments and real-time updates, with timestamps in India Ahmedabad timezone.
- **Comprehensive Admin Dashboard**: Full user and shop management capabilities (CRUD, application review, status management). Features QR Customer Acquisition Analytics, tracking unique customers who discovered shops via QR scans.
- **Dynamic Homepage**: Mobile-first design focusing on QR scanning and login, highlighting features like real-time chat and order tracking.
- **File Management**: Supports all file types with unlimited file uploads (up to 500MB per file, 100 files per order). Files are stored locally and automatically deleted upon order completion.
- **Smart Order Logic**: Customer dashboards dynamically adapt UI based on order status.
- **24/7 Shop Support**: Logic to handle shops operating 24 hours or overnight across all platform components and QR codes.
- **Pure JWT Authentication**: Bcrypt hashing for passwords, stateless JWT tokens (24h expiry), and protected API routes with role-based middleware.
- **Comprehensive Order/Chat History**: Dedicated read-only sections for completed orders and their associated chat logs.
- **Order Deletion System**: Soft delete implementation with role-based permissions, retaining deleted orders in the database for tracking.
- **Shop Slug System**: Manual shop slug entry during application with validation.
- **Optimized Shop Dashboard**: Streamlined dashboard with key metrics (Today's Orders, Pending Orders, Completed Today, Average Processing Time).
- **Technical Debt Elimination**: Cleaned duplicate code, unified component architecture, consistent TypeScript typing, proper error handling, and separation of concerns.
- **SEO Optimization**: Complete SEO implementation with meta tags, Open Graph, Twitter Cards, structured data (JSON-LD), dynamic sitemap.xml, robots.txt, and canonical URLs.
- **Production Deployment**: Fixed Netlify serverless functions, improved error handling, database initialization scripts, and comprehensive deployment guide.
- **Professional UI Design**: Clean, mobile-first design removing gimmicky elements while maintaining brand consistency with golden yellow (#FFBF00) and black color scheme.

## Development Setup

### Active Entry Points
- **Development**: `server/dev-vite.ts` (Port 3001, Vite + Sequelize)
- **Production**: `server/production.js` (Netlify deployment)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT token signing secret
- `ADMIN_EMAIL`: Admin user email
- `ADMIN_PASSWORD`: Admin user password
- `SESSION_SECRET`: Session encryption secret

### Recent Architectural Cleanup (January 2025)
- Removed legacy entry points: `src/server.js`, `src/server.mjs`, `src/index.js`
- Fixed Netlify deployment configuration conflicts
- Standardized port configuration (Replit port 5000, defaults to 3001 elsewhere)
- Cleaned up duplicate configuration files
- Updated Netlify redirects to use single API function
- Updated SEO and favicon implementation with user-provided branding assets
- Fixed Netlify deployment issues: module format conflicts, missing assets, duplicate methods
- Created production build script for proper asset copying and deployment preparation
- Configured all production environment variables for Netlify deployment (January 2025)
- Fixed Netlify function import/export issues by converting to pure ES modules (.mjs)

### Object Storage File Access Fix (August 2025)
- **Critical File URL Pattern Fix**: Resolved file access issues by correcting all file URLs from `/objects/{path}` to `/objects/.private/{path}` format
- **Comprehensive Component Updates**: Fixed file URLs across all components (print-helpers, chat system, order details, shop dashboard, order history)
- **Verified Object Storage Integration**: Confirmed files properly redirect to Google Cloud Storage signed URLs with 302 responses
- **Real-time Notification System**: Implemented actual database query-based notification counts replacing empty array responses
- **Status-Based File Upload Control**: Chat system now properly disables file uploads for completed orders while preserving access to existing files
- **Consistent File Operations**: Print, download, and view functions now work correctly across all platform components

### Major Codebase Cleanup (August 2025)
- **Complete Duplicate Backend Removal**: Eliminated entire duplicate backend structure in `client/` directory (controllers, routes, middleware, models, config)
- **Backup File Cleanup**: Removed all 10 backup files (.backup extensions) with zero functionality impact
- **Netlify Dependency Removal**: Completely removed Netlify deployment infrastructure (netlify/, netlify.toml) 
- **Architecture Simplification**: Reduced from 269 to 226 TypeScript/JavaScript files while maintaining 100% functionality
- **Platform Agnostic**: Application now ready for deployment on any platform (Railway, Render, VPS) without Netlify dependencies
- **Clean Single Source**: Backend code now exists only in `src/` directory, eliminating sync issues and confusion

### Working Hours Display System Fix (August 2025)
- **Eliminated Hardcoded Text**: Removed "Standard hours" fallback from working-hours.ts utility that was masking actual shop timings
- **Enhanced CSV Import Logic**: Fixed import scripts to properly parse Google Maps time formats ("8:30 AM to 10 PM") into structured database format
- **Comprehensive Format Support**: Working hours utility now handles legacy string formats, structured objects, and mixed data types seamlessly
- **24/7 Operation Support**: Added proper detection and display of 24-hour operations with "24/7 Open" text and is24Hours flag
- **Complex Schedule Handling**: Support for different opening/closing times per day (e.g., Saturday 9 AM vs weekdays 8:30 AM)
- **Database Migration Scripts**: Created fix-working-hours-format.js for converting existing malformed working hours to proper structured format
- **Authentic Data Display**: All shop modals now show real working hours from CSV/Google Maps data instead of generic placeholder text

### Mobile Responsiveness Improvements (August 2025)
- **Mobile-First Header Design**: Implemented responsive header with hamburger menu for mobile devices, compact status toggle, and proper button sizing
- **Responsive Navigation**: Desktop navigation hidden on mobile with dropdown menu containing all navigation options (Analytics, QR Code, History, Settings)
- **Mobile-Optimized Stats Cards**: Redesigned stats cards with responsive grid (2 columns on mobile, 4 on desktop) and adaptive text sizing
- **Responsive Search & Filters**: Mobile-friendly search input and filter buttons with grid layout for smaller screens
- **Adaptive Orders Layout**: Simplified 2-column layout on desktop, single column on mobile with responsive headers and badges
- **Mobile-First Typography**: Implemented responsive text sizing (sm:text-lg for titles, xs:text-sm for secondary text)
- **Touch-Friendly Interactions**: Optimized button sizes and touch targets for mobile users with proper spacing and padding

### Authentication & User Management Fixes (January 2025)
- **Critical Race Condition Fix**: Resolved authentication flow where setUser() was preventing name collection modal from appearing
- **Authorization Security**: Added user permission checks in updateUser controller to prevent unauthorized profile modifications
- **Frontend State Management**: Fixed customer account page to properly update local form state after successful API mutations
- **Technical Debt Elimination**: Removed duplicate name collection modal from homepage, preserved original implementation in customer dashboard
- **JWT Authentication**: Enhanced authentication headers across all profile update operations for proper authorization

### Comprehensive Authentication Audit & Fixes (January 2025)
- **Name Modal Logic Fix**: Fixed condition to show modal for users with name='Customer' (not just empty names)
- **State Synchronization**: Resolved profile update issues where frontend showed stale data after successful backend updates
- **API Pattern Consistency**: Fixed incorrect updateUser usage in redesigned-homepage.tsx and other components
- **React Hooks Compliance**: Resolved hooks rule violations by proper context usage at component level
- **Backend Authorization**: Enhanced user update controller with proper permission checks and detailed logging
- **Cross-Component Consistency**: Ensured all customer dashboard pages use consistent authentication patterns

### Shop Modal UI/Data Synchronization Fixes (August 2025)
- **Working Hours Chronology**: Fixed both shop modals to display working hours in proper chronological order (Sunday → Saturday)
- **Real-time Order Count**: Implemented Shop.increment('totalOrders') in order creation process for live order count synchronization
- **Modal Button Updates**: Replaced "Order Now" and "Login to Print" buttons with "Call the Shop" functionality across all shop modals
- **Custom Services/Equipment**: Verified proper visibility of custom services and equipment in both detailed-shop-modal.tsx and shop-view-modal.tsx
- **Order Count Display**: Updated order count text to "Successfully completed X orders" format for better user understanding
- **Database Sync**: Ensured real-time updates between order placement and shop statistics display in modals

### WhatsApp OTP Verification System (August 2025)
- **JWT Token Extension**: Extended JWT tokens from 24 hours to 90 days for maximum session persistence with refresh token mechanism
- **Gupshup API Integration**: Implemented WhatsApp OTP service using Gupshup API for secure user authentication
- **Smart Authentication Flow**: Added intelligent session checking - skips OTP if valid JWT exists, reducing user friction
- **Enhanced Auth Context**: Added sendWhatsAppOTP() and verifyWhatsAppOTP() methods with automatic token management
- **OTP Verification Modal**: Created reusable component with countdown timer, retry logic, and proper error handling
- **Order Integration Hook**: Developed useOTPOrder hook for seamless OTP integration with order placement flow
- **Background Processing**: OTP verification runs in background while file uploads continue for optimal user experience
- **Security Features**: Rate limiting, device fingerprinting, 6-digit OTP codes with 10-minute expiry
- **API Endpoints**: /api/auth/send-otp, /api/auth/verify-otp, /api/auth/refresh-token
- **Simplified QR Authentication**: Removed all authentication from QR scanning - QR codes now redirect directly to order page where authentication occurs, eliminating technical debt as requested
- **Flexible Phone Validation**: Enhanced phone number validation to accept any 10-15 digit number for testing and international compatibility

## External Dependencies

- **sequelize**: PostgreSQL ORM.
- **@tanstack/react-query**: Server state management.
- **ws**: WebSocket implementation.
- **multer**: File upload middleware.
- **zod**: Runtime type validation.
- **@radix-ui/***: Headless UI components.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **date-fns**: Date manipulation utility.
- **vite**: Frontend build tool.
- **tsx**: TypeScript execution.
- **esbuild**: Production bundling.
- **bcrypt**: Password hashing.
- **qrcode**: QR code generation.
- **html2canvas**: HTML to canvas rendering.