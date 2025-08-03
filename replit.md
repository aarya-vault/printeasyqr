# PrintEasy QR - Business Printing Platform

## Overview
PrintEasy QR is a comprehensive B2B2C digital platform connecting customers with local print shops. It supports two order flows: digital file uploads and walk-in orders. The platform streamlines order management, communication, and operations for print shops, while offering customers convenient access to printing services. The vision is to be a production-ready platform with robust admin management, mobile responsiveness, and strong branding.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a clean, professional UI with a strict golden yellow (#FFBF00) and black color scheme, avoiding gradients. Design prioritizes mobile-first responsiveness, ensuring optimal experience across all devices. Key elements include a prominent QR scanner on the homepage, unified navigation across customer and shop owner dashboards, and clear visual indicators for statuses and actions. All interfaces are designed for efficiency, eliminating unnecessary animations and complexity.

### Technical Implementations
- **Frontend**: React 18.3.1 with TypeScript, Vite, Tailwind CSS, shadcn/ui, and React Context API with TanStack Query for state management.
- **Backend**: Express.js with TypeScript (ESM modules).
- **Database**: PostgreSQL with Drizzle ORM, utilizing Neon Database for serverless hosting.
- **Authentication**: Phone-based authentication with simulated verification, supporting Customer, Shop Owner, and Admin roles. Admin authentication uses email/password with bcrypt hashing.
- **Real-time Communication**: Custom WebSocket implementation for live order updates, messages, and notifications.
- **File Handling**: Multer for file uploads, storing files locally. Supports PDF, DOC, DOCX, JPG, PNG, TXT up to 50MB per file, with automatic deletion upon order completion. Print functionality handles various file types for direct browser printing.
- **Monorepo Structure**: Separated client, server, and shared code for clear organization.

### Feature Specifications
- **Order Flows**: Digital file upload and walk-in order booking.
- **Dashboard Systems**: Unified dashboards for customers, shop owners, and administrators, providing comprehensive management capabilities (user, shop, order).
- **QR System**: Shops have unique, branded QR codes for customer shop unlocking and seamless order initiation.
- **Chat System**: Unified, real-time messaging between customers and shop owners, including file attachments and unread message indicators. Shop owners can manage multiple conversations.
- **Shop Management**: Admins can approve/manage shop applications and all shop details. Shop owners can manage working hours and business details.
- **Order Tracking**: Real-time status updates via WebSocket, with detailed timelines and read-only chat history for completed orders.
- **Security**: Bcrypt password hashing, environment variable-based credentials, authentication middleware for all sensitive API endpoints, and role-based access control.

### System Design Choices
- **Clean Architecture**: Minimized technical debt by consolidating duplicate components and standardizing patterns.
- **Performance Optimization**: Optimized queries, implemented background data refetching, and real-time updates for responsiveness.
- **Error Handling**: Comprehensive error states, user-friendly messages, and robust fallback mechanisms.
- **Scalability Considerations**: Designed with database connection pooling and modular architecture for future expansion.

## External Dependencies
- **Database**: `@neondatabase/serverless`
- **ORM**: `drizzle-orm`
- **State Management**: `@tanstack/react-query`
- **WebSockets**: `ws`
- **File Uploads**: `multer`
- **Validation**: `zod`
- **UI Components**: `@radix-ui/*`, `tailwindcss`, `lucide-react`
- **Date Utilities**: `date-fns`
- **Build Tools**: `vite`, `tsx`, `esbuild`
- **QR Code Generation**: `qrcode`, `html2canvas`