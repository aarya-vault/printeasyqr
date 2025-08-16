# PrintEasy QR - Business Printing Platform

A sophisticated B2B2C digital platform connecting customers with local print shops through QR codes and digital ordering.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**Admin Login:** Use configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` secrets  
**Customer Login:** Any 10-digit Indian phone number (6-9 prefix)  
**Shop Owner Login:** Email/password for registered shops

## 🏗️ Architecture

- **Frontend:** React 18.3 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Sequelize ORM + PostgreSQL
- **Storage:** Cloudflare R2 + Local fallback (500MB files, 20 files/order)
- **Auth:** JWT tokens (90-day expiry) + WhatsApp OTP via Gupshup API
- **Real-time:** WebSocket for chat and notifications

## 🎯 Key Features

### 🔥 **Emergency Shop Override**
Shop owners can toggle availability regardless of working hours using the `isOnline` master switch.

### 📱 **WhatsApp OTP Authentication**
Seamless phone-based login with OTP delivery via WhatsApp API.

### 🖨️ **Bulletproof Print System**
PDF.js integration ensures consistent rendering across all browsers with intelligent memory management.

### 💬 **Real-time Messaging**
WebSocket-powered chat between customers and shop owners with file attachments.

### 🏪 **107 Authentic Print Shops**
Production database with verified businesses including Google Maps integration.

## 🛡️ Production Status

**CTO Assessment Score: 8.0/10** - Production Ready ✅

- ✅ Complete database migration to Replit PostgreSQL
- ✅ Clean Sequelize-only architecture 
- ✅ 500+ concurrent user capacity
- ✅ Comprehensive security implementation
- ✅ Real-time file processing up to 500MB
- ✅ Object storage integration with R2

## 📊 Database

- **Users:** 85+ (customers, shop owners, admin)
- **Shops:** 107 authentic print shops with Google Maps data
- **Orders:** Complete workflow with file attachments
- **Messages:** Real-time chat history

## 🔐 Environment Setup

Required secrets:
```bash
DATABASE_URL=          # Replit PostgreSQL
JWT_SECRET=           # JWT signing
ADMIN_EMAIL=          # Admin login
ADMIN_PASSWORD=       # Admin password
GUPSHUP_API_KEY=      # WhatsApp OTP
R2_ACCESS_KEY_ID=     # Cloudflare R2
R2_SECRET_ACCESS_KEY= # Cloudflare R2
R2_BUCKET_NAME=       # Storage bucket
```

## 🚀 Deployment

The platform is configured for Replit deployment with zero-config setup:

```bash
npm run build    # Build for production
npm start        # Start production server
```

**Live URL:** Replit provides automatic HTTPS and custom domain support.

---

**Latest Update:** August 16, 2025 - Database migration completed, architecture cleaned up  
**Version:** 1.0.0 Production Ready