# PrintEasy QR - Business Printing Platform

## Overview
PrintEasy QR is a B2B2C digital platform designed to connect customers with local print shops, streamlining order management and communication. Its core purpose is to facilitate printing services through digital file uploads and walk-in orders. The platform includes robust admin management and a unique QR generation system, facilitating connections without handling financial transactions. The vision is to create a production-ready platform that simplifies the printing process for businesses and consumers. Key capabilities include digital order placement, walk-in order booking, real-time chat, and comprehensive admin controls.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Configuration management: Centralized environment configuration with hardcoded database URLs
- Architecture preference: Single source of truth for all configuration via .env files

## System Architecture

### Design Philosophy
The platform employs a clean, professional, and consistent visual identity, utilizing a strict color palette of golden yellow (`#FFBF00`) and black, with a "no gradients" rule. Design prioritizes mobile-first responsiveness for elegant scaling across devices.

### Technology Stack
- **Frontend**: React 18.3.1 (Vite, TypeScript), Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Express.js with Sequelize ORM.
- **Database**: PostgreSQL.
- **Real-time**: WebSocket connections.
- **File Handling**: Multer with local storage.
- **State Management**: React Context API, TanStack Query.
- **Authentication**: Pure JWT tokens.

### Architectural Patterns
- **Monorepo Structure**: Client, server, and shared code separation.
- **Component-Based UI**: Emphasizes reusable and modular React components.
- **RESTful API with WebSockets**: For data exchange and real-time updates.
- **Clean Architecture**: Ensures unified components across Customer, Shop Owner, and Admin dashboards.
- **Role-Based Access Control**: Differentiates functionalities based on user roles.

### Core Features & Implementations
- **QR Generation System**: Generates unique, branded QR codes for shop unlocking and direct order page redirection.
- **Order Flows**: Supports both digital file uploads and walk-in order booking.
- **Unified Chat System**: Provides real-time communication between customers and shop owners with file attachment capabilities.
- **Admin Dashboard**: Manages users and shops (CRUD operations, application review, status management, QR Customer Acquisition Analytics).
- **Dynamic Homepage**: Mobile-first design focusing on QR scanning, login, real-time chat, and order tracking.
- **File Management**: Supports various file types and uploads (up to 50MB/file, 20 files/order).
- **Pure JWT Authentication**: Features Bcrypt hashing, stateless JWT tokens, and role-based middleware.
- **Shop Slug System**: Enables manual entry and validation of unique shop slugs.
- **Optimized Shop Dashboard**: Displays key metrics such as Today's Orders, Pending, Completed, and Average Processing Time.
- **SEO Optimization**: Comprehensive implementation including meta tags, Open Graph, Twitter Cards, structured data, dynamic sitemap, robots.txt, and canonical URLs.
- **Object Storage Integration**: Utilizes Cloudflare R2 for order files and local storage for QR codes/chat attachments.
- **Working Hours Display**: Utility for parsing and displaying complex shop working hours.
- **Mobile Responsiveness**: Implemented mobile-first headers, navigation, and touch-friendly interactions.
- **WhatsApp OTP System**: Integrates Gupshup API for WhatsApp OTP authentication.
- **Print Host Pattern with PDF.js**: Ensures consistent PDF rendering across browsers.
- **Real-time WebSocket Notifications**: Provides instant chat notifications and real-time order updates.
- **Google Maps Integration**: Seamless integration with Google Maps data, featuring "View on Google Maps" buttons.
- **Shop Status Management System**: Allows shop owners to control their shop's online status.
- **Queue Number System & Random Public IDs**: Implements a dual ID system for internal sequential IDs and customer-facing random alphanumeric public IDs.
- **Enhanced JWT Authentication Flow**: Integrates just-in-time authentication for anonymous order flows.
- **Advanced Order Management**: Sophisticated queue calculation logic focusing on active orders, role-based order creation safeguards.
- **One-Email-One-Shop Enforcement**: Database constraints and backend validation ensure each email address can only own one shop.
- **"Queue #" Rebranding**: Systematically replaced all "Order #" references with "Queue #" across the platform.

### Database Configuration
- **Database**: PostgreSQL (Replit Neon managed instance).
- **ORM**: Sequelize.
- **Schema**: Manual SQL migrations in `src/migrations/` directory.
- **Protection**: Database sync disabled, proper indexing implemented, unique constraints on shop slugs, shop emails, user emails, user phones.
- **Deployment Build Process**: `build.js` skips database operations; `SKIP_MIGRATIONS=true` prevents deployment hanging.
- **Configuration**: `.env` file accessed directly via `process.env` throughout the project, serving as the single source of truth.

## External Dependencies

- **@tanstack/react-query**: Server state management.
- **aws-sdk**: S3-compatible Cloudflare R2 integration.
- **bcrypt**: Password hashing.
- **date-fns**: Date manipulation.
- **html2canvas**: Rendering HTML to canvas.
- **lucide-react**: Icons.
- **multer**: File uploads.
- **puppeteer-core**: QR code generation templates.
- **qrcode**: QR code generation.
- **@radix-ui/***: Headless UI components.
- **sequelize**: PostgreSQL ORM.
- **tailwindcss**: CSS styling.
- **tsx**: TypeScript execution.
- **vite**: Frontend build tooling.
- **ws**: WebSocket implementation.
- **zod**: Runtime type validation.
- **Gupshup API**: For WhatsApp OTP authentication.
- **Google Maps API**: For map integrations.
- **Cloudflare R2**: Object storage for files.
- **PDF.js**: PDF rendering.

## Recent Updates (August 20, 2025)

### ✅ FIVE SHOPS MVP COMPLETED - READY FOR LAUNCH  
- **Complete Database Reset**: All previous data cleared for comprehensive MVP start
- **Five Authentic Shops Added**: All imported from exact Google Maps URLs with authentic data
  - **Arihant Xerox** (Sola, Ahmedabad) - 4.3 rating, 12 Google reviews
    - Address: GF-5, City Center, opp. shukan mall, Science City, Sola - 380060
    - Phone: 091050 71050 (verified from Google Maps)
    - Hours: Mon-Sat 9:30 AM - 9:00 PM, Sunday 10:00 AM - 2:00 PM
    - Services: Xerox Services, Printing, Photocopying, Document Services
  - **Umiya Xerox & Stationers** (Sola, Ahmedabad) - 4.1 rating, 34 Google reviews  
    - Address: GF- 95,96 Umiya Xerox, Shukan mall Nr. Cims Hospital, Sola - 380060
    - Phone: 098989 17474 (verified from Google Maps)
    - Hours: Mon-Sat 8:00 AM - 8:00 PM, Sunday 8:00 AM - 12:00 PM
    - Services: Xerox Services, Printing, Photocopying, Stationery Supplies
  - **Thakar Stationary** (Sola, Ahmedabad) - 3.7 rating, 3 Google reviews
    - Address: Gf-5, Sahaj Arcade, Science City Rd, opp. Satyam Complex, Sola - 380060
    - Phone: 096629 59400 (verified from Google Maps)
    - Hours: Mon-Sun 9:00 AM - 9:00 PM (open all week)
    - Services: Stationery Supplies, Office Materials, Student Supplies, Books
  - **SHREEJI STATIONERY & XEROX** (Ghatlodiya, Ahmedabad) - 4.8 rating, 169 Google reviews
    - Address: 6, Jitendra Shopping Centre, opp. Ranna Park, Ghatlodiya, Ahmedabad, Gujarat 380063
    - Phone: 083202 47834 (verified from Google Maps)
    - Hours: Mon-Sun 9:00 AM - 10:30 PM (open all week, latest hours)
    - Services: Stationery Supplies, Xerox Services, Office Materials, Student Supplies
  - **Riddhi Xerox** (Ghatlodiya, Ahmedabad) - 4.4 rating, 177 Google reviews
    - Address: Shop B 16, Suntrack Shopping Centre, Near Bhagyoday Bank, Ghatlodiya, Nirnay Nagar - 380061
    - Phone: 098245 46048 (verified from Google Maps)
    - Hours: Mon-Sat 9:00 AM - 9:00 PM, Sunday 9:00 AM - 12:00 PM
    - Services: Xerox Services, Printing, Photocopying, Document Services
- **Authentic Google Maps Data**: All contact information and business hours verified from exact Google Maps listings
- **Clean MVP Setup**: No images, five shop focus for comprehensive launch
- **Login Credentials**: admin@printeasyqr.com / PrintEasyQR@2025 (admin), shop emails / PrintEasyQR@2025 (shops)

### ✅ EXACT SHOP DETAILS UPDATE (August 20, 2025)
- **100% Accurate Google Maps Data**: All phone numbers, addresses, and business hours updated with exact information from user-provided Google Maps listings
- **Verified Contact Information**: All phone numbers directly copied from Google Maps business profiles
- **Precise Business Hours**: Working hours match Google Maps exactly, including unique Sunday schedules for each shop
- **Updated SHREEJI Address**: Corrected to exact Ghatlodiya location from Google Maps