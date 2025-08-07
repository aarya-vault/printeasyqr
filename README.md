# PrintEasy QR - Business Printing Platform

A production-ready QR-based printing service platform connecting customers with local print shops.

## Quick Start

### Prerequisites
- Node.js >= 20.5.0
- PostgreSQL database

### Installation
```bash
npm install
```

### Environment Setup
Create `.env` file with:
```
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@yourdomain.com  
ADMIN_PASSWORD=your_secure_password
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Features
- QR code generation for shops
- Customer & shop owner authentication  
- Order management with file uploads
- Real-time messaging
- Admin dashboard
- Indian pincode database (19,583+ locations)

## Architecture
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Express.js + Sequelize ORM
- Database: PostgreSQL
- Authentication: JWT tokens

## API Endpoints
- Customer Auth: `/api/auth/phone-login`
- Shop Owner Auth: `/api/auth/email-login` 
- QR Generation: `/api/generate-qr`
- Order Management: `/api/orders/*`
- Admin: `/api/admin/*`

## Deployment Ready
All core functionality tested and operational:
- ✅ Customer registration & authentication
- ✅ Shop owner login & management
- ✅ QR generation with branding
- ✅ Order placement & tracking
- ✅ File uploads & management
- ✅ Admin dashboard & controls