# PrintEasy QR - Business Printing Platform

## Overview
PrintEasy QR is a B2B2C digital platform connecting customers with local print shops to streamline order management and communication. It facilitates printing services through digital file uploads and walk-in orders. The platform features robust admin management and a unique QR generation system, focusing on connecting users without handling financial transactions. Its vision is to be a production-ready platform that simplifies the printing process for businesses and consumers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Design Philosophy
The platform employs a clean, professional, and consistent visual identity using a strict color palette of golden yellow (`#FFBF00`) and black, with a "no gradients" rule. Design prioritizes mobile-first responsiveness, ensuring elegant scaling across devices.

### Technology Stack
- **Frontend**: React 18.3.1 (Vite, TypeScript), Tailwind CSS, shadcn/ui, Radix UI.
- **Backend**: Express.js with Sequelize ORM.
- **Database**: PostgreSQL.
- **Real-time**: WebSocket connections.
- **File Handling**: Multer for local storage.
- **State Management**: React Context API, TanStack Query.
- **Authentication**: Pure JWT tokens.

### Architectural Patterns
- **Monorepo Structure**: Separated client, server, and shared code.
- **Component-Based UI**: Reusable and modular React components.
- **RESTful API with WebSockets**: For data exchange and real-time updates.
- **Clean Architecture**: Unified components across dashboards (Customer, Shop Owner, Admin).
- **Role-Based Access Control**: Differentiated functionalities for Customer, Shop Owner, and Admin.

### Core Features & Implementations
- **Revolutionary QR Generation**: Hybrid microservice leveraging Vercel serverless functions (with Puppeteer-core fallback) to generate unique, branded QR codes for shop unlocking and direct order page redirection.
- **Order Flows**: Supports digital file upload and walk-in order booking.
- **Unified Chat System**: Real-time customer-shop owner communication with file attachments and timestamps.
- **Comprehensive Admin Dashboard**: Manages users and shops (CRUD, application review, status), including QR Customer Acquisition Analytics.
- **Dynamic Homepage**: Mobile-first design focusing on QR scanning, login, real-time chat, and order tracking.
- **File Management**: Supports all file types, unlimited uploads (up to 500MB/file, 100 files/order), with local storage and automatic deletion on order completion.
- **Smart Order Logic**: Customer dashboards adapt UI based on order status.
- **24/7 Shop Support**: Logic to handle 24-hour operations across the platform.
- **Pure JWT Authentication**: Bcrypt hashing, stateless JWT tokens, and role-based middleware for API protection.
- **Comprehensive Order/Chat History**: Read-only sections for completed orders and chat logs.
- **Order Deletion System**: Soft delete with role-based permissions.
- **Shop Slug System**: Manual entry and validation of unique shop slugs.
- **Optimized Shop Dashboard**: Key metrics (Today's Orders, Pending, Completed, Average Processing Time).
- **SEO Optimization**: Complete SEO implementation including meta tags, Open Graph, Twitter Cards, structured data, dynamic sitemap, robots.txt, and canonical URLs.
- **Production Deployment**: Enhanced error handling, database initialization, and deployment readiness.
- **Professional UI Design**: Clean, mobile-first design maintaining brand consistency with golden yellow and black.
- **Object Storage Integration**: Corrected file access URLs to `/objects/.private/{path}` for proper redirection to Google Cloud Storage signed URLs.
- **Working Hours Display**: Robust utility to parse and display complex shop working hours, including 24/7 operations and varied daily schedules, removing hardcoded text.
- **Mobile Responsiveness**: Implemented mobile-first headers, navigation, stats cards, search/filters, order layouts, typography, and touch-friendly interactions.
- **WhatsApp OTP System**: Integrated Gupshup API for WhatsApp OTP authentication, with intelligent session checking, extended JWT tokens (90 days), and background processing for file uploads during OTP verification. QR codes now directly redirect to order pages, where authentication occurs, simplifying the flow.

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