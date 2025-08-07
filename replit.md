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