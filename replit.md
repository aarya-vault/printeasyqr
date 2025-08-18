# PrintEasy QR - Business Printing Platform

## Overview
PrintEasy QR is a B2B2C digital platform that connects customers with local print shops to streamline order management and communication. Its primary purpose is to facilitate printing services through digital file uploads and walk-in orders. The platform includes robust admin management and a unique QR generation system, designed to connect users without handling financial transactions. The vision is to create a production-ready platform that simplifies the printing process for businesses and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Design Philosophy
The platform adopts a clean, professional, and consistent visual identity, adhering to a strict color palette of golden yellow (`#FFBF00`) and black with a "no gradients" rule. Design prioritizes mobile-first responsiveness for elegant scaling across devices.

### Technology Stack
- **Frontend**: React 18.3.1 (Vite, TypeScript), Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Express.js with Sequelize ORM.
- **Database**: PostgreSQL.
- **Real-time**: WebSocket connections.
- **File Handling**: Multer with local storage.
- **State Management**: React Context API, TanStack Query.
- **Authentication**: Pure JWT tokens.

### Architectural Patterns
- **Monorepo Structure**: Client, server, and shared code are separated.
- **Component-Based UI**: Emphasizes reusable and modular React components.
- **RESTful API with WebSockets**: Used for data exchange and real-time updates.
- **Clean Architecture**: Ensures unified components across Customer, Shop Owner, and Admin dashboards.
- **Role-Based Access Control**: Differentiates functionalities based on user roles.

### Core Features & Implementations
- **QR Generation System**: Generates unique, branded QR codes for shop unlocking and direct order page redirection, leveraging serverless functions for branding and styling.
- **Order Flows**: Supports both digital file uploads and walk-in order booking.
- **Unified Chat System**: Provides real-time communication between customers and shop owners with file attachment capabilities.
- **Admin Dashboard**: Manages users and shops (CRUD operations, application review, status management, QR Customer Acquisition Analytics).
- **Dynamic Homepage**: Mobile-first design focusing on QR scanning, login, real-time chat, and order tracking.
- **File Management**: Supports various file types, uploads (up to 50MB/file, 20 files/order), with automatic deletion upon order completion.
- **Pure JWT Authentication**: Features Bcrypt hashing, stateless JWT tokens, and role-based middleware for API protection.
- **Shop Slug System**: Enables manual entry and validation of unique shop slugs.
- **Optimized Shop Dashboard**: Displays key metrics such as Today's Orders, Pending, Completed, and Average Processing Time.
- **SEO Optimization**: Comprehensive implementation including meta tags, Open Graph, Twitter Cards, structured data, dynamic sitemap, robots.txt, and canonical URLs.
- **Production Deployment**: Includes enhanced error handling and database initialization for deployment readiness.
- **Object Storage Integration**: Utilizes Cloudflare R2 for order files and local storage for QR codes/chat attachments, with a unified storage manager.
- **Working Hours Display**: Robust utility for parsing and displaying complex shop working hours, including 24/7 operations.
- **Mobile Responsiveness**: Implemented mobile-first headers, navigation, and touch-friendly interactions across the platform.
- **WhatsApp OTP System**: Integrates Gupshup API for WhatsApp OTP authentication, with intelligent session checking and extended JWT tokens.
- **Print Host Pattern with PDF.js**: Ensures consistent PDF rendering across browsers with enhanced cancellation options and intelligent memory management for large files.
- **Real-time WebSocket Notifications**: Provides instant chat notifications and real-time order updates across all user interfaces.
- **Google Maps Integration**: Seamless integration with Google Maps data, featuring "View on Google Maps" buttons and consistent branding.
- **Shop Status Management System**: Allows shop owners to control their shop's online status, overriding working hours for immediate availability changes.
- **Queue Number System & Random Public IDs**: Implements a dual ID system for internal sequential IDs and customer-facing random alphanumeric public IDs, with queue numbers resetting upon order completion.
- **Enhanced JWT Authentication Flow**: Integrates just-in-time authentication for anonymous order flows, with automatic user creation/lookup and extended token validity.
- **Advanced Order Management**: Sophisticated queue calculation logic focusing on active orders, role-based order creation safeguards, and comprehensive error handling.
- **One-Email-One-Shop Enforcement**: Database constraints and backend validation ensure each email address can only own one shop, with automatic duplicate cleanup and prevention systems.

## External Dependencies

- **@tanstack/react-query**: For server state management.
- **aws-sdk**: Used for S3-compatible Cloudflare R2 integration.
- **bcrypt**: For password hashing.
- **date-fns**: For date manipulation.
- **esbuild**: For production bundling.
- **html2canvas**: For rendering HTML to canvas.
- **lucide-react**: For icons.
- **multer**: For file uploads.
- **puppeteer-core**: Used for QR code generation templates.
- **qrcode**: For QR code generation.
- **@radix-ui/***: For headless UI components.
- **sequelize**: For PostgreSQL ORM.
- **tailwindcss**: For CSS styling.
- **tsx**: For TypeScript execution.
- **vite**: For frontend build tooling.
- **ws**: For WebSocket implementation.
- **zod**: For runtime type validation.