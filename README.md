# PrintEasy QR - QR-Powered Print Management Platform

A comprehensive B2B2C digital platform connecting customers with local print shops through QR code technology.

## 🚀 Quick Start

### Local Development
```bash
# Clone and navigate to project
cd PrintEasy-QR

# Start development server
node -r tsx/esm server/index-fixed.ts

# Access at: http://localhost:5000
```

### Alternative Commands
```bash
# Production server
node server/production.js

# Simple server
node server/simple-dev.js
```

## 🛠 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Sequelize ORM 
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** JWT tokens
- **File Handling:** Multer + local storage
- **QR Generation:** Built-in with branding
- **Real-time:** WebSocket connections

## 🌟 Features

- **QR Code System:** Unique branded QR codes for each shop
- **Dual Order Flows:** Digital file uploads & walk-in bookings
- **Real-time Chat:** Customer-shop owner communication
- **Admin Dashboard:** Complete user and shop management
- **Mobile-First Design:** Golden yellow (#FFBF00) and black theme
- **File Support:** All formats, up to 500MB per file
- **Indian Pincode DB:** 19,583+ locations with auto-complete

## 📱 User Roles

- **Customers:** Phone-based authentication, order management
- **Shop Owners:** Email/password login, order processing  
- **Admins:** Complete platform management

## 🗄️ Database

Pure Sequelize ORM system with PostgreSQL backend:
- Users, Shops, Orders, Messages, Shop Applications
- JWT authentication with 24h expiry
- Comprehensive audit trails

## 🚀 Deployment

Production-ready with Netlify configuration:
- Serverless functions
- Environment variables documented
- CDN-optimized assets
- Database migrations

## 📞 Support

For technical issues, refer to `FINAL_DEVELOPER_GUIDE.md` for comprehensive setup instructions.