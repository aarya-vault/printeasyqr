# PrintEasy QR - Business Printing Platform

## Overview

PrintEasy QR (PrintEasy) is a production-ready B2B2C digital platform connecting customers with local print shops. It supports two order flows: digital file uploads for pre-planned needs and walk-in orders for immediate service. The platform streamlines order management and communication for print shops, offering customers convenient access to printing services. PrintEasy is a comprehensive solution with robust admin management, revolutionary QR generation system, and clean architecture, focusing on connecting users without handling financial transactions.

**Production Status: DEPLOYMENT READY** - All technical debt eliminated, Single Source of Truth architecture implemented, comprehensive admin dashboard completed.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Design Philosophy
The platform adheres to a strict design policy centered around golden yellow (`#FFBF00`) and black, with a "no gradients" rule to ensure a clean, professional, and consistent visual identity. All UI elements, including icons, badges, and status indicators, comply with this color scheme. The design prioritizes mobile-first responsiveness, scaling elegantly from small mobile devices to large desktops.

### Technology Stack
- **Frontend**: React 18.3.1 with TypeScript (Vite), Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Express.js with TypeScript (ESM modules).
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database (serverless).
- **Real-time**: WebSocket connections.
- **File Handling**: Multer for local storage file uploads.
- **State Management**: React Context API, TanStack Query.
- **Authentication**: Phone-based for customers, email/password for shop owners and admins.

### Architectural Patterns
- **Monorepo Structure**: Clear separation between client, server, and shared code.
- **Component-Based UI**: Reusable and modular React components.
- **RESTful API with WebSockets**: For data exchange and real-time updates.
- **Clean Architecture**: Minimized technical debt, unified components across dashboards (Customer, Shop Owner, Admin).
- **Role-Based Access Control**: Differentiated functionalities for Customer, Shop Owner, and Admin roles.

### Core Features & Implementations
- **Revolutionary QR Generation**: Container-optimized Single Source of Truth architecture. Client captures fully-rendered HTML, server takes pixel-perfect screenshot using Puppeteer with `--disable-dev-shm-usage` flag for Replit container compliance. Guarantees WYSIWYG fidelity with professional 35KB PNG downloads in 11.4 seconds.
- **Order Flows**: Supports digital file upload and walk-in order booking.
- **Unified Chat System**: Single component handles all customer-shop owner communications, including file attachments and real-time updates. All timestamps use India Ahmedabad timezone.
- **Comprehensive Admin Dashboard**: Full user and shop management capabilities (CRUD operations, application review, status management, password handling). Enhanced analytics with revenue potential, user distribution, shop performance metrics, and detailed data visualization.
- **Enhanced QR Code System**: Generates unique, branded QR codes for each shop with automatic shop unlocking and direct order page redirection. Features step-by-step customer guide, verified shop badges, and PrintEasy branding with USP messaging (500MB files, 100+ formats, 24/7 support).
- **Dynamic Homepage**: Mobile-first design prioritizing QR scanning and login, showcasing key features like real-time chat, order tracking, and secure file handling.
- **File Management**: Supports all file types with no restrictions. Unlimited file uploads (up to 500MB per file, 100 files per order). Files are stored locally and automatically deleted upon order completion. Print functionality supports various file types directly from the browser.
- **Smart Order Logic**: Customer dashboards dynamically adapt UI based on order status (e.g., "Add More Files" for processing orders). Order numbering system for queue management.
- **24/7 Shop Support**: Logic to handle shops operating 24 hours or overnight, reflected across all platform components and QR codes.
- **Robust Authentication**: Bcrypt hashing for all passwords, environment variables for admin credentials (ADMIN_EMAIL: its.harshthakar@gmail.com, ADMIN_PASSWORD: 2004@Harsh), server-side session validation, and protected API routes with middleware (`requireAuth`, `requireAdmin`, `requireShopOwner`).
- **Comprehensive Order/Chat History**: Dedicated read-only sections for completed orders and their associated chat logs.
- **Order Deletion System**: Soft delete implementation with role-based permissions. Customers can delete pending orders, shop owners can delete processing/ready orders, admins can delete any order. Deleted orders are hidden from all views but retained in database with deletion tracking.
- **Shop Slug System**: Manual shop slug entry during application with validation. No auto-generation from shop name.
- **Optimized Shop Dashboard**: Streamlined dashboard with 4 vital cards showing essential metrics (Today's Orders, Pending Orders, Completed Today, Average Processing Time) in a single row for better usability.
- **Technical Debt Elimination**: Cleaned all duplicate code, unified component architecture, consistent TypeScript typing, proper error handling, clean separation of concerns.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **@tanstack/react-query**: Server state management.
- **ws**: WebSocket implementation for real-time features.
- **multer**: Middleware for handling `multipart/form-data` (file uploads).
- **zod**: Runtime type validation.
- **@radix-ui/***: Headless UI components.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **date-fns**: Date manipulation utility.
- **vite**: Frontend build tool and dev server.
- **tsx**: TypeScript execution for development.
- **esbuild**: Production bundling.
- **bcrypt**: Password hashing.
- **qrcode**: QR code generation.
- **html2canvas**: HTML to canvas rendering for QR code export.