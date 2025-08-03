# PrintEasy QR - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Features & Functionalities](#features--functionalities)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [File Management](#file-management)
9. [Real-time Features](#real-time-features)
10. [Deployment Guide](#deployment-guide)
11. [Flutter App Development Guide](#flutter-app-development-guide)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Performance Optimization](#performance-optimization)
14. [Maintenance & Monitoring](#maintenance--monitoring)

## Project Overview

PrintEasy QR is a comprehensive B2B2C digital platform connecting customers with local print shops. The platform streamlines the printing process through QR code scanning, digital file uploads, and walk-in order management.

### Key Objectives
- Connect customers with nearby print shops instantly
- Eliminate waiting times through pre-ordering
- Enable real-time communication between customers and shop owners
- Provide transparent order tracking and management
- Support both digital and walk-in printing needs

### Target Users
1. **Customers**: Individuals and businesses needing printing services
2. **Shop Owners**: Local print shop operators looking to digitize their business
3. **Administrators**: Platform managers overseeing operations

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Context API, TanStack Query v5
- **Routing**: Wouter
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL (Neon Database serverless)
- **ORM**: Drizzle ORM
- **Real-time**: WebSocket (ws library)
- **File Handling**: Multer
- **Authentication**: Passport.js with session management
- **Session Store**: connect-pg-simple

### Infrastructure
- **Hosting**: Replit Deployments
- **Database**: Neon Database (serverless PostgreSQL)
- **File Storage**: Local storage with automatic cleanup
- **Environment**: Production-ready with environment variables

## Features & Functionalities

### Customer Features
1. **QR Code Scanning**
   - Scan shop QR codes to instantly access services
   - Automatic shop unlocking upon scan
   - Direct order placement from scan

2. **Order Management**
   - Upload multiple files (up to 500MB per file, 100 files per order)
   - Create walk-in bookings for immediate service
   - Track order status in real-time
   - Mark orders as urgent for priority processing

3. **Communication**
   - Real-time chat with shop owners
   - File sharing within chat
   - Order-specific conversations
   - Unread message notifications

4. **Dashboard Features**
   - Active order tracking
   - Order history access
   - Visited shops management
   - Profile and settings management

### Shop Owner Features
1. **Shop Management**
   - Online/offline status toggle
   - Working hours configuration
   - Contact information management
   - Service offerings customization

2. **Order Processing**
   - Real-time order notifications
   - Status updates (new → processing → ready → completed)
   - File download and printing capabilities
   - Customer communication

3. **Analytics & Insights**
   - Daily order statistics
   - Peak hour analysis
   - Customer retention metrics
   - Revenue potential tracking
   - Weekly trend analysis

4. **QR Code System**
   - Unique shop QR codes with branding
   - Downloadable QR materials
   - Share functionality
   - Permanent QR assignment

### Admin Features
1. **User Management**
   - View and manage all users
   - Edit user details
   - Password reset capabilities
   - Role assignment

2. **Shop Management**
   - Application review and approval
   - Shop status management
   - Shop details editing
   - Performance monitoring

3. **Platform Analytics**
   - Total users and shops tracking
   - Revenue potential calculations
   - User distribution analysis
   - Order volume trends
   - Platform growth metrics

4. **System Management**
   - Database maintenance
   - User activity monitoring
   - Platform settings configuration

## User Roles & Permissions

### Customer
- Create and manage orders
- Chat with shop owners
- View order history
- Update profile information
- Delete pending orders only

### Shop Owner
- Manage shop settings
- Process orders
- Chat with customers
- View shop analytics
- Delete processing/ready orders
- Toggle shop availability

### Administrator
- Full platform access
- User and shop management
- View all analytics
- Delete any order
- System configuration
- **Credentials**: 
  - Email: its.harshthakar@gmail.com
  - Password: 2004@Harsh

## Database Schema

### Core Tables

#### users
```sql
- id: Serial Primary Key
- phone: Unique varchar(10)
- name: varchar(255)
- email: varchar(255)
- password: varchar(255)
- role: enum('customer', 'shop_owner', 'admin')
- created_at: timestamp
- updated_at: timestamp
```

#### shops
```sql
- id: Serial Primary Key
- owner_id: Foreign Key to users
- name: varchar(255)
- slug: Unique varchar(255)
- phone: varchar(10)
- public_contact_number: varchar(10)
- address: text
- city: varchar(100)
- working_hours: jsonb
- is_online: boolean
- accepts_walkin_orders: boolean
- is_approved: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### orders
```sql
- id: Serial Primary Key
- customer_id: Foreign Key to users
- shop_id: Foreign Key to shops
- customer_name: varchar(255)
- customer_phone: varchar(10)
- type: enum('upload', 'walkin')
- title: varchar(255)
- description: text
- status: enum('new', 'processing', 'ready', 'completed')
- files: jsonb
- walkin_time: timestamp
- specifications: jsonb
- is_urgent: boolean
- order_number: integer
- delivery_date: timestamp
- deleted_at: timestamp (soft delete)
- deleted_by: integer
- created_at: timestamp
- updated_at: timestamp
```

#### messages
```sql
- id: Serial Primary Key
- order_id: Foreign Key to orders
- sender_id: Foreign Key to users
- sender_role: varchar(50)
- content: text
- attachments: jsonb
- read_by_customer: boolean
- read_by_shop_owner: boolean
- created_at: timestamp
```

#### shop_applications
```sql
- id: Serial Primary Key
- shop_name: varchar(255)
- owner_name: varchar(255)
- phone: varchar(10)
- address: text
- city: varchar(100)
- status: enum('pending', 'approved', 'rejected')
- shop_slug: varchar(255)
- created_at: timestamp
- updated_at: timestamp
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (phone/email based)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Customer Endpoints
- `GET /api/customers/visited-shops` - Get visited shops
- `GET /api/customers/orders` - Get customer orders
- `POST /api/customers/unlock-shop` - Unlock shop after QR scan
- `PATCH /api/customers/:id` - Update customer profile

### Shop Endpoints
- `GET /api/shops` - List all approved shops
- `GET /api/shops/:id` - Get shop details
- `GET /api/shops/slug/:slug` - Get shop by slug
- `GET /api/shops/owner/:ownerId` - Get shop by owner
- `PATCH /api/shops/:id` - Update shop details
- `PATCH /api/shops/:id/toggle-status` - Toggle online status
- `POST /api/shops/apply` - Submit shop application

### Order Endpoints
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/shop/:shopId` - Get shop orders
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Soft delete order

### Message Endpoints
- `GET /api/messages/order/:orderId` - Get order messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/order/:orderId/read` - Mark messages as read

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/shops` - List all shops
- `GET /api/admin/analytics` - Get platform analytics
- `PATCH /api/admin/users/:id` - Update user
- `PATCH /api/admin/shops/:id` - Update shop
- `POST /api/admin/users/:id/reset-password` - Reset user password

## Authentication & Security

### Authentication Flow
1. **Customer Login**: Phone number based authentication
2. **Shop Owner Login**: Email/password authentication
3. **Admin Login**: Email/password with environment variable credentials

### Security Measures
- Bcrypt password hashing
- Session-based authentication
- CORS protection
- Input validation with Zod
- SQL injection prevention via Drizzle ORM
- XSS protection
- Rate limiting on sensitive endpoints

### Middleware
- `requireAuth`: Ensures user is authenticated
- `requireShopOwner`: Validates shop owner access
- `requireAdmin`: Validates admin access

## File Management

### Upload Configuration
- **Max File Size**: 500MB per file
- **Max Files**: 100 files per order
- **Supported Formats**: All file types supported
- **Storage**: Local uploads directory
- **Cleanup**: Automatic deletion upon order completion

### File Handling Flow
1. Customer uploads files via multipart form
2. Multer processes and stores files locally
3. File metadata stored in database
4. Shop owner can download/print files
5. Files auto-deleted when order marked complete

## Real-time Features

### WebSocket Implementation
- Real-time order status updates
- Instant message delivery
- Online/offline status broadcasting
- Connection management per user

### Event Types
- `order:new` - New order notification
- `order:statusUpdate` - Order status change
- `message:new` - New chat message
- `shop:statusUpdate` - Shop online/offline change

## Deployment Guide

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Environment variables configured

### Environment Variables
```env
DATABASE_URL=postgresql://...
PGHOST=...
PGDATABASE=...
PGUSER=...
PGPASSWORD=...
PGPORT=5432
ADMIN_EMAIL=its.harshthakar@gmail.com
ADMIN_PASSWORD=2004@Harsh
SESSION_SECRET=your-secret-key
```

### Deployment Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run database migrations: `npm run db:push`
5. Build application: `npm run build`
6. Start production server: `npm start`

### Replit Deployment
1. Import project to Replit
2. Configure secrets in Replit dashboard
3. Click "Deploy" button
4. Application available at `https://your-app.replit.app`

## Flutter App Development Guide

### Overview
The Flutter app serves as a mobile client for the PrintEasy platform, providing native performance and enhanced user experience.

### Architecture
```
flutter_app/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   ├── api_config.dart
│   │   └── theme.dart
│   ├── models/
│   │   ├── user.dart
│   │   ├── shop.dart
│   │   ├── order.dart
│   │   └── message.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   ├── websocket_service.dart
│   │   └── storage_service.dart
│   ├── screens/
│   │   ├── auth/
│   │   ├── customer/
│   │   ├── shop_owner/
│   │   └── common/
│   ├── widgets/
│   │   ├── common/
│   │   └── custom/
│   └── utils/
├── assets/
├── android/
├── ios/
└── pubspec.yaml
```

### Key Features to Implement

#### 1. QR Code Scanner
```dart
import 'package:qr_code_scanner/qr_code_scanner.dart';

class QRScannerScreen extends StatefulWidget {
  @override
  _QRScannerScreenState createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: QRView(
        key: qrKey,
        onQRViewCreated: _onQRViewCreated,
        overlay: QrScannerOverlayShape(
          borderColor: Color(0xFFFFBF00),
          borderRadius: 10,
          borderLength: 30,
          borderWidth: 10,
          cutOutSize: 300,
        ),
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      // Process QR code data
      if (scanData.code != null) {
        _processQRCode(scanData.code!);
      }
    });
  }
}
```

#### 2. File Upload with Progress
```dart
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';

class FileUploadService {
  final Dio _dio = Dio();

  Future<void> uploadFiles(
    List<PlatformFile> files,
    Function(double) onProgress,
  ) async {
    for (var file in files) {
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path!,
          filename: file.name,
        ),
      });

      await _dio.post(
        '${API_BASE_URL}/api/upload',
        data: formData,
        onSendProgress: (sent, total) {
          onProgress(sent / total);
        },
      );
    }
  }
}
```

#### 3. Real-time Chat
```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class ChatService {
  late WebSocketChannel _channel;
  
  void connect(String userId) {
    _channel = WebSocketChannel.connect(
      Uri.parse('ws://your-server/ws?userId=$userId'),
    );
    
    _channel.stream.listen((message) {
      // Handle incoming messages
    });
  }
  
  void sendMessage(String content, int orderId) {
    _channel.sink.add(json.encode({
      'type': 'message',
      'orderId': orderId,
      'content': content,
    }));
  }
}
```

#### 4. Push Notifications
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  
  Future<void> initialize() async {
    // Request permissions
    await _fcm.requestPermission();
    
    // Get token
    String? token = await _fcm.getToken();
    // Send token to backend
    
    // Handle messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Show local notification
    });
  }
}
```

### API Integration
```dart
class ApiService {
  static const String baseUrl = 'https://your-api.replit.app';
  final Dio _dio = Dio();
  
  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.interceptors.add(AuthInterceptor());
  }
  
  Future<User> login(String phone) async {
    final response = await _dio.post('/api/auth/login', data: {
      'phone': phone,
    });
    return User.fromJson(response.data);
  }
  
  Future<List<Shop>> getShops() async {
    final response = await _dio.get('/api/shops');
    return (response.data as List)
        .map((shop) => Shop.fromJson(shop))
        .toList();
  }
}
```

### State Management (Provider)
```dart
import 'package:provider/provider.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  
  Future<void> login(String phone) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _user = await ApiService().login(phone);
      await StorageService.saveUser(_user!);
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### UI Theme
```dart
class AppTheme {
  static const Color brandYellow = Color(0xFFFFBF00);
  static const Color richBlack = Color(0xFF0A0908);
  
  static ThemeData get theme => ThemeData(
    primaryColor: brandYellow,
    colorScheme: ColorScheme.light(
      primary: brandYellow,
      secondary: richBlack,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: richBlack,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: brandYellow,
        foregroundColor: richBlack,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
  );
}
```

### Dependencies (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Core
  dio: ^5.3.2
  provider: ^6.0.5
  shared_preferences: ^2.2.1
  
  # UI
  flutter_svg: ^2.0.7
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # Features
  qr_code_scanner: ^1.0.1
  file_picker: ^5.5.0
  image_picker: ^1.0.4
  web_socket_channel: ^2.4.0
  
  # Utilities
  intl: ^0.18.1
  url_launcher: ^6.1.14
  connectivity_plus: ^4.0.2
  
  # Notifications
  firebase_core: ^2.21.0
  firebase_messaging: ^14.7.3
  flutter_local_notifications: ^16.1.0
```

### Build & Release

#### Android
1. Update `android/app/build.gradle` with version info
2. Generate signed APK: `flutter build apk --release`
3. Generate App Bundle: `flutter build appbundle --release`

#### iOS
1. Update version in Xcode
2. Archive and upload to App Store Connect
3. Submit for review

## Testing & Quality Assurance

### Frontend Testing
```typescript
// Component Testing
describe('OrderCard', () => {
  it('displays order information correctly', () => {
    const order = mockOrder();
    render(<OrderCard order={order} />);
    expect(screen.getByText(order.title)).toBeInTheDocument();
  });
});

// Integration Testing
describe('Order Flow', () => {
  it('creates order successfully', async () => {
    const user = userEvent.setup();
    render(<ShopOrder />);
    
    await user.type(screen.getByLabelText('Title'), 'Test Order');
    await user.click(screen.getByText('Create Order'));
    
    expect(await screen.findByText('Order created')).toBeInTheDocument();
  });
});
```

### Backend Testing
```typescript
// API Testing
describe('POST /api/orders', () => {
  it('creates order with valid data', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(validOrderData)
      .expect(201);
      
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('new');
  });
});

// Database Testing
describe('Order Model', () => {
  it('updates status correctly', async () => {
    const order = await createOrder();
    await updateOrderStatus(order.id, 'processing');
    
    const updated = await getOrder(order.id);
    expect(updated.status).toBe('processing');
  });
});
```

## Performance Optimization

### Implemented Optimizations
1. **React Lazy Loading**: All routes use dynamic imports
2. **Query Optimization**: 
   - Stale-while-revalidate strategy
   - Background refetching
   - Optimistic updates
3. **Image Optimization**:
   - Lazy loading images
   - WebP format support
   - Responsive images
4. **Bundle Optimization**:
   - Code splitting
   - Tree shaking
   - Minification

### Database Optimization
1. **Indexes**: Added on frequently queried columns
2. **Query Optimization**: Using selective queries
3. **Connection Pooling**: Managed by Neon
4. **Soft Deletes**: Preserving data integrity

### Caching Strategy
1. **Browser Caching**: Static assets cached
2. **API Response Caching**: Via React Query
3. **Session Storage**: User preferences
4. **Local Storage**: Persistent user data

## Maintenance & Monitoring

### Regular Tasks
1. **Database Maintenance**
   - Weekly backup verification
   - Monthly index optimization
   - Quarterly data archival

2. **Security Updates**
   - Weekly dependency updates
   - Monthly security audits
   - Immediate patch deployment

3. **Performance Monitoring**
   - Real-time error tracking
   - Performance metrics collection
   - User experience monitoring

### Monitoring Tools
1. **Application Monitoring**
   - Error logging
   - Performance metrics
   - User analytics

2. **Database Monitoring**
   - Query performance
   - Connection pool status
   - Storage usage

3. **Infrastructure Monitoring**
   - Server uptime
   - Resource utilization
   - Traffic patterns

### Backup & Recovery
1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery
   - Geo-redundant storage

2. **File Backups**
   - Weekly upload directory backup
   - Automated cleanup logs
   - Recovery procedures

### Support & Documentation
1. **User Support**
   - In-app help documentation
   - FAQ section
   - Contact support option

2. **Developer Documentation**
   - API documentation
   - Code comments
   - Architecture diagrams

---

## Contact & Support
For technical support or questions about the platform:
- **Admin Email**: its.harshthakar@gmail.com
- **Documentation**: This document
- **Source Code**: Available in repository

Last Updated: January 2025