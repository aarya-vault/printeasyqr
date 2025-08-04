# PrintEasy QR - API Documentation

## Overview

PrintEasy QR is a comprehensive B2B2C digital platform connecting customers with local print shops. This document provides complete API documentation for the backend services.

## Authentication System

### JWT Token Authentication (Primary)
- **Method**: JWT (JSON Web Token) 
- **Header**: `Authorization: Bearer <token>`
- **Storage**: localStorage (frontend)
- **Expiry**: 24 hours

### Session Authentication (Fallback)
- **Method**: Express sessions with MemoryStore
- **Cookie**: `printeasy_session`
- **Duration**: 24 hours

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

---

## Authentication Endpoints

### POST /auth/phone-login
**Customer phone-based authentication**

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "id": 1,
  "phone": "9876543210",
  "name": "Customer",
  "role": "customer",
  "email": null,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "needsNameUpdate": true
}
```

### POST /auth/email-login
**Shop owner/admin email+password authentication**

**Request Body:**
```json
{
  "email": "shop@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 2,
  "email": "shop@example.com",
  "name": "Shop Owner",
  "role": "shop_owner",
  "phone": "9876543210",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me
**Get current authenticated user**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "phone": "9876543210",
  "email": "user@example.com",
  "name": "User Name",
  "role": "customer",
  "needsNameUpdate": false
}
```

### POST /auth/logout
**Logout current user**

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

### PATCH /users/:id
**Update user profile**

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "new@example.com"
}
```

### GET /users/:id
**Get user by ID**

**Headers:**
```
Authorization: Bearer <token>
```

---

## Shop Endpoints

### GET /shops
**Get all active shops (Public)**

**Response:**
```json
[
  {
    "id": 1,
    "name": "PrintShop Pro",
    "slug": "printshop-pro",
    "address": "123 Main St",
    "phone": "9876543210",
    "isActive": true,
    "operatingHours": "9 AM - 6 PM"
  }
]
```

### GET /shops/slug/:slug
**Get shop by slug (Public)**

### GET /shops/owner/:ownerId
**Get shops owned by user**

**Headers:**
```
Authorization: Bearer <token>
```

### PATCH /shops/settings
**Update shop settings**

**Headers:**
```
Authorization: Bearer <token>
```

### POST /unlock-shop/:shopSlug
**Unlock shop for customer**

**Headers:**
```
Authorization: Bearer <token>
```

---

## Order Management Endpoints

### POST /orders
**Create new order**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
shopId: 1
orderType: "upload"
instructions: "Print in color"
files: [File objects]
```

### GET /orders/customer/:customerId
**Get orders for customer**

**Headers:**
```
Authorization: Bearer <token>
```

### GET /orders/shop/:shopId
**Get orders for shop**

**Headers:**
```
Authorization: Bearer <token>
```

### PATCH /orders/:id/status
**Update order status**

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "processing" | "ready" | "completed"
}
```

### DELETE /orders/:id
**Delete order (soft delete)**

**Headers:**
```
Authorization: Bearer <token>
```

---

## Message/Chat Endpoints

### GET /messages/order/:orderId
**Get messages for order**

**Headers:**
```
Authorization: Bearer <token>
```

### POST /messages
**Send message**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
orderId: 1
content: "Message text"
files: [File objects] (optional)
```

### PATCH /messages/mark-read
**Mark messages as read**

**Headers:**
```
Authorization: Bearer <token>
```

---

## File Management

### GET /download/:filename
**Download file**

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** File download with proper headers

---

## QR Code Generation

### POST /generate-qr
**Generate QR code image (Public)**

**Request Body:**
```json
{
  "shopSlug": "printshop-pro",
  "shopName": "PrintShop Pro"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

---

## Admin Endpoints

All admin endpoints require `requireAdmin` middleware.

### GET /admin/stats
**Get platform statistics**

### GET /admin/users
**Get all users**

### DELETE /admin/users/:id
**Delete user**

### GET /admin/shops
**Get all shops**

---

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Security Features

- **JWT Token Validation**: All protected endpoints validate JWT tokens
- **Role-Based Access Control**: Admin, shop_owner, customer roles
- **File Upload Security**: 500MB file limit, all file types supported
- **CORS Protection**: Properly configured for cross-origin requests
- **SQL Injection Protection**: Sequelize ORM with parameterized queries
- **Password Hashing**: bcrypt with salt rounds

---

## Rate Limiting

- **File Uploads**: 100 files per order, 500MB per file
- **API Requests**: Standard rate limiting applied
- **Session Duration**: 24 hours with rolling refresh

---

## Development Notes

- **Environment**: Replit-optimized configuration
- **Database**: PostgreSQL with Sequelize ORM
- **File Storage**: Local filesystem (uploads/ directory)
- **WebSocket**: Real-time messaging support
- **Session Management**: MemoryStore for development

---

This documentation covers all API endpoints available in the PrintEasy QR platform. All endpoints return JSON responses unless otherwise specified.