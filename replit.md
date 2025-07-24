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

### UI/UX Complete Overhaul
- **Responsive Homepage**: Complete redesign with mobile-first approach, proper spacing, and professional layout
- **Enhanced Customer Dashboard**: Modern interface with shop browsing, order management, and file upload capabilities
- **Enhanced Shop Dashboard**: Comprehensive shop owner interface with order processing, analytics, and QR code management
- **Enhanced Admin Dashboard**: Complete platform management with shop application review, user management, and analytics
- **Mobile Responsiveness**: All interfaces properly responsive across mobile, tablet, and desktop devices

### Enhanced Features
- **Shop Application System**: Advanced modal with slug configuration, custom services, and day-wise operating hours
- **Email Authentication**: Shop owners now use email instead of phone for authentication
- **Comprehensive Test Data**: Full database seeding with realistic shops, orders, users, messages, and notifications
- **QR Code Integration**: Shop-specific QR codes for walk-in order collection
- **Real-time Messaging**: Chat system between customers and shop owners
- **Order Tracking**: Complete order lifecycle management with status updates

### Technical Improvements
- **Database Schema**: Updated with proper relations, shop slugs, and enhanced data models
- **Authentication System**: Improved role-based access with proper session management
- **File Upload System**: Enhanced with proper validation and security measures
- **Performance Optimization**: Improved loading states, error handling, and user feedback

The platform now provides a complete B2B2C solution with professional UI/UX, comprehensive feature set, and excellent mobile responsiveness.