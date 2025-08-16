# PrintEasy QR - Complete Setup Instructions

## Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## 1. Project Setup
```bash
# Extract the project
tar -xzf printeasy-qr-clean.tar.gz
cd printeasy-qr

# Install all dependencies
npm install
```

## 2. Required Dependencies
The following packages are included in package.json:

**Core Dependencies:**
- express, sequelize, pg (backend)
- react, vite, typescript (frontend)
- @radix-ui/* components (UI library)
- tailwindcss, tailwindcss-animate (styling)

**Development Dependencies:**
- tsx (TypeScript execution)
- @vitejs/plugin-react (Vite React support)

## 3. Environment Variables
Create a `.env` file:
```env
NODE_ENV=development
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-jwt-secret-key
PORT=5000
```

## 4. Database Setup
Your PostgreSQL database should have these models:
- Users (customers, shop owners, admins)
- Shops (print shops with details)
- Orders (print orders)
- Messages (chat system)
- ShopApplications (shop registration requests)

## 5. Run the Application
```bash
# Development mode (with Vite)
npm run dev

# Simple development mode (without Vite)
npm run dev-simple

# Production build
npm run build
npm start
```

## 6. Key Features
- React frontend with TypeScript
- Express.js backend with Sequelize ORM
- JWT authentication
- QR code generation for shops
- Real-time chat system
- File upload support
- Admin dashboard
- Mobile-responsive design

## 7. Architecture
- Frontend: client/src/ (React + TypeScript)
- Backend: src/ (Express + Sequelize)
- Server: server/ (Development servers)
- Database: PostgreSQL with Sequelize models

The app runs on http://localhost:5000 with API routes at /api/*