# PrintEasy QR - Flutter Mobile App Development Guide

*Complete guide for building the PrintEasy QR mobile application*

---

## 📱 **Project Overview**

This guide provides comprehensive instructions for developing a Flutter mobile app that integrates with the existing PrintEasy QR web platform. The mobile app will serve as a companion to the web platform, focusing on QR scanning, order management, and real-time communication.

---

## 🏗️ **App Architecture**

### **Core Concept**
The Flutter app acts as a **mobile-first interface** to the existing PrintEasy QR backend, providing:
- Native QR code scanning
- Push notifications for real-time updates
- Mobile-optimized user interface
- Offline capabilities for basic operations

### **Integration Strategy**
- **Backend Reuse**: Leverage existing Express.js API endpoints
- **Real-time Sync**: WebSocket connections for live updates
- **Authentication**: Use existing phone/email authentication system
- **File Management**: Native file picker with cloud sync

---

## 🛠️ **Technical Stack**

### **Flutter Dependencies**
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP & API
  dio: ^5.3.2
  retrofit: ^4.0.3
  json_annotation: ^4.8.1
  
  # State Management
  bloc: ^8.1.2
  flutter_bloc: ^8.1.3
  
  # QR Code Scanning
  qr_code_scanner: ^1.0.1
  mobile_scanner: ^3.5.6
  
  # File Management
  file_picker: ^6.1.1
  image_picker: ^1.0.4
  path_provider: ^2.1.1
  
  # Real-time Communication
  web_socket_channel: ^2.4.0
  socket_io_client: ^2.0.3
  
  # UI Components
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # Push Notifications
  firebase_messaging: ^14.7.9
  flutter_local_notifications: ^16.3.2
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.2
  
  # Permissions
  permission_handler: ^11.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.7
  retrofit_generator: ^8.0.4
  json_serializable: ^6.7.1
  hive_generator: ^2.0.1
```

---

## 📁 **Project Structure**

```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── routes/
│   │   ├── app_routes.dart
│   │   └── route_generator.dart
│   └── themes/
│       ├── app_theme.dart
│       └── colors.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_constants.dart
│   │   └── storage_keys.dart
│   ├── errors/
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/
│   │   ├── api_client.dart
│   │   ├── dio_client.dart
│   │   └── websocket_client.dart
│   ├── services/
│   │   ├── notification_service.dart
│   │   ├── storage_service.dart
│   │   └── permission_service.dart
│   └── utils/
│       ├── validators.dart
│       ├── formatters.dart
│       └── extensions.dart
├── data/
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── shop_model.dart
│   │   ├── order_model.dart
│   │   └── message_model.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── shop_repository.dart
│   │   ├── order_repository.dart
│   │   └── chat_repository.dart
│   └── datasources/
│       ├── remote/
│       │   ├── auth_remote_datasource.dart
│       │   ├── shop_remote_datasource.dart
│       │   └── order_remote_datasource.dart
│       └── local/
│           ├── auth_local_datasource.dart
│           └── cache_datasource.dart
├── presentation/
│   ├── blocs/
│   │   ├── auth/
│   │   ├── qr_scanner/
│   │   ├── orders/
│   │   └── chat/
│   ├── screens/
│   │   ├── splash/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── qr_scanner/
│   │   ├── orders/
│   │   ├── chat/
│   │   └── profile/
│   └── widgets/
│       ├── common/
│       ├── forms/
│       └── custom/
└── features/
    ├── qr_scanner/
    ├── orders/
    ├── chat/
    └── notifications/
```

---

## 🎨 **Design System**

### **Color Palette**
```dart
// lib/app/themes/colors.dart
class AppColors {
  // Primary Colors (matching web platform)
  static const Color brandYellow = Color(0xFFFFBF00);
  static const Color richBlack = Color(0xFF000000);
  static const Color pureWhite = Color(0xFFFFFFFF);
  
  // Supporting Colors
  static const Color lightGray = Color(0xFFF5F5F5);
  static const Color mediumGray = Color(0xFF9CA3AF);
  static const Color darkGray = Color(0xFF374151);
  
  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
}
```

### **Typography**
```dart
// lib/app/themes/app_theme.dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: AppColors.brandYellow,
      scaffoldBackgroundColor: AppColors.pureWhite,
      fontFamily: 'System UI',
      
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: AppColors.richBlack,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppColors.richBlack,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: AppColors.darkGray,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: AppColors.mediumGray,
        ),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandYellow,
          foregroundColor: AppColors.richBlack,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
```

---

## 🔧 **API Integration**

### **API Client Setup**
```dart
// lib/core/network/api_client.dart
import 'package:retrofit/retrofit.dart';
import 'package:dio/dio.dart';

part 'api_client.g.dart';

@RestApi()
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  // Authentication
  @POST('/api/auth/phone-login')
  Future<UserModel> phoneLogin(@Body() PhoneLoginRequest request);
  
  @POST('/api/auth/email-login')
  Future<UserModel> emailLogin(@Body() EmailLoginRequest request);
  
  @GET('/api/auth/me')
  Future<UserModel> getCurrentUser();
  
  @POST('/api/auth/logout')
  Future<void> logout();

  // Shops
  @GET('/api/shops/owner/{ownerId}')
  Future<ShopResponse> getShopByOwnerId(@Path() int ownerId);
  
  @POST('/api/unlock-shop/{shopSlug}')
  Future<UnlockResponse> unlockShop(
    @Path() String shopSlug,
    @Body() UnlockRequest request,
  );

  // Orders
  @GET('/api/orders/customer/{customerId}')
  Future<List<OrderModel>> getCustomerOrders(@Path() int customerId);
  
  @GET('/api/orders/shop/{shopId}')
  Future<List<OrderModel>> getShopOrders(@Path() int shopId);
  
  @POST('/api/orders')
  @MultiPart()
  Future<OrderModel> createOrder(
    @Part() int shopId,
    @Part() int customerId,
    @Part() String customerName,
    @Part() String customerPhone,
    @Part() String orderType,
    @Part() String instructions,
    @Part() List<MultipartFile> files,
  );

  // File Downloads
  @GET('/api/download/{filename}')
  @DioResponseType(ResponseType.bytes)
  Future<HttpResponse<List<int>>> downloadFile(@Path() String filename);
}
```

### **WebSocket Implementation**
```dart
// lib/core/network/websocket_client.dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class WebSocketClient {
  WebSocketChannel? _channel;
  Stream<dynamic>? _stream;
  
  void connect(String url) {
    _channel = WebSocketChannel.connect(Uri.parse(url));
    _stream = _channel!.stream.asBroadcastStream();
  }
  
  void authenticate(int userId) {
    send({
      'type': 'authenticate',
      'userId': userId,
    });
  }
  
  void sendChatMessage({
    required int orderId,
    required int senderId,
    required String content,
  }) {
    send({
      'type': 'chat_message',
      'orderId': orderId,
      'senderId': senderId,
      'content': content,
    });
  }
  
  void send(Map<String, dynamic> message) {
    _channel?.sink.add(json.encode(message));
  }
  
  Stream<dynamic> get messages => _stream!;
  
  void disconnect() {
    _channel?.sink.close();
  }
}
```

---

## 📸 **QR Scanner Implementation**

### **QR Scanner Screen**
```dart
// lib/presentation/screens/qr_scanner/qr_scanner_screen.dart
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class QRScannerScreen extends StatefulWidget {
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  MobileScannerController controller = MobileScannerController();
  bool isScanning = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: AppColors.brandYellow,
        foregroundColor: AppColors.richBlack,
        actions: [
          IconButton(
            icon: Icon(controller.torchEnabled ? Icons.flash_on : Icons.flash_off),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera View
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (!isScanning) return;
              
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                final String? code = barcode.rawValue;
                if (code != null && code.contains('printeasyqr.com/shop/')) {
                  setState(() => isScanning = false);
                  _handleQRCode(code);
                  break;
                }
              }
            },
          ),
          
          // Scanning Overlay
          _buildScanningOverlay(),
          
          // Bottom Instructions
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Position the QR code within the frame to scan',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanningOverlay() {
    return Center(
      child: Container(
        width: 250,
        height: 250,
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.brandYellow,
            width: 3,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          children: [
            // Corner decorations
            Positioned(
              top: -2,
              left: -2,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: AppColors.brandYellow,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                  ),
                ),
              ),
            ),
            // Add other corners...
          ],
        ),
      ),
    );
  }

  void _handleQRCode(String code) {
    // Extract shop slug from URL
    final uri = Uri.parse(code);
    final shopSlug = uri.pathSegments.last;
    
    // Navigate to shop unlock flow
    Navigator.pushNamed(
      context,
      '/shop-unlock',
      arguments: shopSlug,
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
```

---

## 📱 **Key Screens Implementation**

### **1. Splash Screen**
```dart
// lib/presentation/screens/splash/splash_screen.dart
class SplashScreen extends StatefulWidget {
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Check authentication status
    final authBloc = context.read<AuthBloc>();
    authBloc.add(CheckAuthStatusEvent());
    
    // Wait for minimum splash duration
    await Future.delayed(const Duration(seconds: 2));
    
    // Navigate based on auth status
    if (mounted) {
      final state = authBloc.state;
      if (state is AuthenticatedState) {
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        Navigator.pushReplacementNamed(context, '/auth');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brandYellow,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // PrintEasy Logo
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.richBlack,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text(
                  'P',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: AppColors.brandYellow,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'PrintEasy QR',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.richBlack,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Connect. Print. Easy.',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.darkGray,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### **2. Authentication Screen**
```dart
// lib/presentation/screens/auth/auth_screen.dart
class AuthScreen extends StatefulWidget {
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pureWhite,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),
              
              // Logo and Title
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.richBlack,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text(
                    'P',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.brandYellow,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Welcome to PrintEasy QR',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.richBlack,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Connect with local print shops instantly',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.mediumGray,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 40),
              
              // Tab Bar
              Container(
                decoration: BoxDecoration(
                  color: AppColors.lightGray,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: AppColors.brandYellow,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  labelColor: AppColors.richBlack,
                  unselectedLabelColor: AppColors.mediumGray,
                  tabs: const [
                    Tab(text: 'Customer'),
                    Tab(text: 'Shop Owner'),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Tab Views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildCustomerLogin(),
                    _buildShopOwnerLogin(),
                  ],
                ),
              ),
              
              // QR Scanner Button
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pushNamed(context, '/qr-scanner');
                  },
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Scan QR Code'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.richBlack,
                    side: const BorderSide(color: AppColors.brandYellow),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCustomerLogin() {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthenticatedState) {
          Navigator.pushReplacementNamed(context, '/home');
        } else if (state is AuthErrorState) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Phone Number',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.richBlack,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              hintText: 'Enter your 10-digit phone number',
              prefixText: '+91 ',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppColors.brandYellow),
              ),
            ),
          ),
          const SizedBox(height: 24),
          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              return SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: state is AuthLoadingState
                      ? null
                      : () {
                          final phone = _phoneController.text.trim();
                          if (phone.length == 10) {
                            context.read<AuthBloc>().add(
                              PhoneLoginEvent(phone: phone),
                            );
                          }
                        },
                  child: state is AuthLoadingState
                      ? const CircularProgressIndicator(color: AppColors.richBlack)
                      : const Text('Continue'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildShopOwnerLogin() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Email',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.richBlack,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            hintText: 'Enter your email address',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brandYellow),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Password',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.richBlack,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passwordController,
          obscureText: true,
          decoration: InputDecoration(
            hintText: 'Enter your password',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.brandYellow),
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              final email = _emailController.text.trim();
              final password = _passwordController.text.trim();
              if (email.isNotEmpty && password.isNotEmpty) {
                context.read<AuthBloc>().add(
                  EmailLoginEvent(email: email, password: password),
                );
              }
            },
            child: const Text('Sign In'),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

## 🔔 **Push Notifications**

### **Firebase Setup**
```dart
// lib/core/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Request permissions
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Initialize local notifications
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );
    
    await _localNotifications.initialize(initializationSettings);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    await _showLocalNotification(message);
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    // Handle background message
  }

  static Future<void> _showLocalNotification(RemoteMessage message) async {
    const notificationDetails = NotificationDetails(
      android: AndroidNotificationDetails(
        'printeasy_channel',
        'PrintEasy Notifications',
        importance: Importance.max,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      notificationDetails,
    );
  }

  static Future<String?> getToken() async {
    return await _firebaseMessaging.getToken();
  }
}
```

---

## 📦 **State Management (BLoC)**

### **Authentication BLoC**
```dart
// lib/presentation/blocs/auth/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';

// Events
abstract class AuthEvent {}

class CheckAuthStatusEvent extends AuthEvent {}

class PhoneLoginEvent extends AuthEvent {
  final String phone;
  PhoneLoginEvent({required this.phone});
}

class EmailLoginEvent extends AuthEvent {
  final String email;
  final String password;
  EmailLoginEvent({required this.email, required this.password});
}

class LogoutEvent extends AuthEvent {}

// States
abstract class AuthState {}

class AuthInitialState extends AuthState {}

class AuthLoadingState extends AuthState {}

class AuthenticatedState extends AuthState {
  final UserModel user;
  AuthenticatedState({required this.user});
}

class UnauthenticatedState extends AuthState {}

class AuthErrorState extends AuthState {
  final String message;
  AuthErrorState({required this.message});
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc({required AuthRepository authRepository})
      : _authRepository = authRepository,
        super(AuthInitialState()) {
    
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
    on<PhoneLoginEvent>(_onPhoneLogin);
    on<EmailLoginEvent>(_onEmailLogin);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final user = await _authRepository.getCurrentUser();
      if (user != null) {
        emit(AuthenticatedState(user: user));
      } else {
        emit(UnauthenticatedState());
      }
    } catch (e) {
      emit(UnauthenticatedState());
    }
  }

  Future<void> _onPhoneLogin(
    PhoneLoginEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoadingState());
    try {
      final user = await _authRepository.phoneLogin(event.phone);
      emit(AuthenticatedState(user: user));
    } catch (e) {
      emit(AuthErrorState(message: e.toString()));
    }
  }

  Future<void> _onEmailLogin(
    EmailLoginEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoadingState());
    try {
      final user = await _authRepository.emailLogin(event.email, event.password);
      emit(AuthenticatedState(user: user));
    } catch (e) {
      emit(AuthErrorState(message: e.toString()));
    }
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      await _authRepository.logout();
      emit(UnauthenticatedState());
    } catch (e) {
      emit(AuthErrorState(message: e.toString()));
    }
  }
}
```

---

## 🚀 **Development Roadmap**

### **Phase 1: Core Foundation (Weeks 1-2)**
- [ ] Project setup and dependencies
- [ ] Authentication system (phone/email login)
- [ ] Basic navigation and routing
- [ ] API client integration
- [ ] Local storage setup

### **Phase 2: QR Scanning & Shop Integration (Weeks 3-4)**
- [ ] QR code scanner implementation
- [ ] Shop unlock functionality
- [ ] Shop details display
- [ ] Order creation flow
- [ ] File picker integration

### **Phase 3: Order Management (Weeks 5-6)**
- [ ] Order listing and details
- [ ] Order status tracking
- [ ] File upload/download
- [ ] Order history

### **Phase 4: Real-time Chat (Weeks 7-8)**
- [ ] WebSocket integration
- [ ] Chat interface
- [ ] Message notifications
- [ ] File sharing in chat

### **Phase 5: Advanced Features (Weeks 9-10)**
- [ ] Push notifications
- [ ] Offline capabilities
- [ ] Performance optimization
- [ ] Testing and debugging

### **Phase 6: Polish & Release (Weeks 11-12)**
- [ ] UI/UX refinements
- [ ] App store optimization
- [ ] Beta testing
- [ ] Production release

---

## 📋 **Development Checklist**

### **Pre-Development**
- [ ] Flutter SDK setup (latest stable version)
- [ ] Firebase project configuration
- [ ] Android/iOS development environment
- [ ] API endpoint documentation review
- [ ] Design system implementation

### **Core Features**
- [ ] Splash screen with branding
- [ ] Authentication (phone + email)
- [ ] QR code scanner
- [ ] Shop unlock flow
- [ ] Order creation and management
- [ ] Real-time chat
- [ ] Push notifications
- [ ] File management

### **Quality Assurance**
- [ ] Unit tests for business logic
- [ ] Widget tests for UI components
- [ ] Integration tests for user flows
- [ ] Performance testing
- [ ] Accessibility compliance
- [ ] Platform-specific testing (Android/iOS)

### **Deployment**
- [ ] App signing setup
- [ ] Play Store listing
- [ ] App Store listing
- [ ] Beta testing distribution
- [ ] Production release pipeline

---

## 🔗 **Integration with Web Platform**

### **API Compatibility**
The Flutter app leverages the existing PrintEasy QR web platform APIs:
- All authentication endpoints remain the same
- Order management uses existing REST APIs
- WebSocket connections for real-time features
- File upload/download through existing infrastructure

### **Data Synchronization**
- Real-time sync through WebSocket connections
- Local caching for offline capabilities
- Automatic sync when connectivity is restored
- Consistent data models between web and mobile

### **Shared Features**
- Identical authentication flow
- Same order statuses and workflows
- Unified chat system
- Consistent branding and design principles

---

## 📱 **Platform-Specific Considerations**

### **Android**
- Material Design 3 components
- Back button handling
- File access permissions
- Camera permissions for QR scanning
- Notification channels

### **iOS**
- Human Interface Guidelines compliance
- iOS-specific navigation patterns
- NSCameraUsageDescription for QR scanning
- Push notification setup
- App Store review guidelines

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- App launch time < 2 seconds
- QR scanning success rate > 95%
- Real-time message delivery < 1 second
- File upload success rate > 98%
- Crash-free sessions > 99.5%

### **User Experience Metrics**
- User onboarding completion rate > 80%
- Order creation success rate > 95%
- Customer satisfaction rating > 4.5/5
- App store rating > 4.3/5
- Daily active users growth

---

## 📞 **Support & Resources**

### **Documentation**
- Flutter official documentation
- PrintEasy QR API documentation
- Firebase integration guides
- Platform-specific guidelines

### **Community**
- Flutter community forums
- Stack Overflow for technical issues
- GitHub issues for bug reports
- Discord/Slack for team communication

---

This comprehensive guide provides everything needed to build a production-ready Flutter mobile app for PrintEasy QR. The app will seamlessly integrate with the existing web platform while providing native mobile features and optimal user experience.

**Ready to start development!** 🚀