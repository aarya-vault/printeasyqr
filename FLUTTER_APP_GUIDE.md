# PrintEasy QR Flutter App Development Guide

## Quick Start Guide

This guide provides step-by-step instructions to build the PrintEasy QR mobile app using Flutter.

## Prerequisites
- Flutter SDK (3.0+)
- Android Studio / VS Code
- iOS development setup (for iOS builds)
- Basic knowledge of Dart and Flutter

## Project Setup

### 1. Create Flutter Project
```bash
flutter create printeasy_qr
cd printeasy_qr
```

### 2. Project Structure
```
lib/
├── main.dart
├── config/
│   ├── api_config.dart
│   ├── theme_config.dart
│   └── constants.dart
├── models/
│   ├── user_model.dart
│   ├── shop_model.dart
│   ├── order_model.dart
│   └── message_model.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── websocket_service.dart
│   ├── storage_service.dart
│   └── notification_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── order_provider.dart
│   └── chat_provider.dart
├── screens/
│   ├── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── name_collection_screen.dart
│   ├── customer/
│   │   ├── customer_dashboard.dart
│   │   ├── qr_scanner_screen.dart
│   │   ├── shop_details_screen.dart
│   │   ├── create_order_screen.dart
│   │   ├── order_tracking_screen.dart
│   │   └── chat_screen.dart
│   ├── shop_owner/
│   │   ├── shop_dashboard.dart
│   │   ├── order_management_screen.dart
│   │   └── shop_settings_screen.dart
│   └── common/
│       ├── file_viewer_screen.dart
│       └── profile_screen.dart
├── widgets/
│   ├── common/
│   │   ├── loading_widget.dart
│   │   ├── error_widget.dart
│   │   └── empty_state_widget.dart
│   ├── cards/
│   │   ├── order_card.dart
│   │   ├── shop_card.dart
│   │   └── message_bubble.dart
│   └── dialogs/
│       ├── confirm_dialog.dart
│       └── file_picker_dialog.dart
└── utils/
    ├── validators.dart
    ├── formatters.dart
    └── helpers.dart
```

## Core Implementation

### 1. Main App Configuration (main.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:printeasy_qr/config/theme_config.dart';
import 'package:printeasy_qr/providers/auth_provider.dart';
import 'package:printeasy_qr/screens/splash_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: PrintEasyApp(),
    ),
  );
}

class PrintEasyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PrintEasy QR',
      theme: AppTheme.lightTheme,
      home: SplashScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
```

### 2. Theme Configuration (config/theme_config.dart)
```dart
import 'package:flutter/material.dart';

class AppTheme {
  static const Color brandYellow = Color(0xFFFFBF00);
  static const Color richBlack = Color(0xFF0A0908);
  static const Color lightGray = Color(0xFFF5F5F5);
  
  static ThemeData get lightTheme => ThemeData(
    primaryColor: brandYellow,
    scaffoldBackgroundColor: Colors.white,
    colorScheme: ColorScheme.light(
      primary: brandYellow,
      secondary: richBlack,
      background: Colors.white,
      surface: lightGray,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: richBlack,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: richBlack,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: brandYellow,
        foregroundColor: richBlack,
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightGray,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: brandYellow, width: 2),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
  );
}
```

### 3. API Configuration (config/api_config.dart)
```dart
class ApiConfig {
  static const String baseUrl = 'https://your-app.replit.app';
  static const String wsUrl = 'wss://your-app.replit.app';
  
  static const Duration timeout = Duration(seconds: 30);
  
  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
  };
}
```

### 4. Models Implementation

#### User Model (models/user_model.dart)
```dart
class User {
  final int id;
  final String phone;
  final String? name;
  final String? email;
  final String role;
  final DateTime createdAt;
  
  User({
    required this.id,
    required this.phone,
    this.name,
    this.email,
    required this.role,
    required this.createdAt,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      phone: json['phone'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'name': name,
      'email': email,
      'role': role,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
```

#### Shop Model (models/shop_model.dart)
```dart
class Shop {
  final int id;
  final int ownerId;
  final String name;
  final String slug;
  final String phone;
  final String? publicContactNumber;
  final String address;
  final String city;
  final Map<String, dynamic>? workingHours;
  final bool isOnline;
  final bool acceptsWalkinOrders;
  final bool isApproved;
  
  Shop({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.slug,
    required this.phone,
    this.publicContactNumber,
    required this.address,
    required this.city,
    this.workingHours,
    required this.isOnline,
    required this.acceptsWalkinOrders,
    required this.isApproved,
  });
  
  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['id'],
      ownerId: json['ownerId'],
      name: json['name'],
      slug: json['slug'],
      phone: json['phone'],
      publicContactNumber: json['publicContactNumber'],
      address: json['address'],
      city: json['city'],
      workingHours: json['workingHours'],
      isOnline: json['isOnline'] ?? false,
      acceptsWalkinOrders: json['acceptsWalkinOrders'] ?? true,
      isApproved: json['isApproved'] ?? false,
    );
  }
}
```

### 5. Services Implementation

#### API Service (services/api_service.dart)
```dart
import 'package:dio/dio.dart';
import 'package:printeasy_qr/config/api_config.dart';
import 'package:printeasy_qr/services/storage_service.dart';

class ApiService {
  late Dio _dio;
  static final ApiService _instance = ApiService._internal();
  
  factory ApiService() => _instance;
  
  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.timeout,
      receiveTimeout: ApiConfig.timeout,
      headers: ApiConfig.headers,
    ));
    
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Handle unauthorized
          StorageService.clearUser();
          // Navigate to login
        }
        handler.next(error);
      },
    ));
  }
  
  // Customer Auth
  Future<Map<String, dynamic>> customerLogin(String phone) async {
    final response = await _dio.post('/api/auth/login', data: {
      'phone': phone,
    });
    return response.data;
  }
  
  // Shop Owner Auth
  Future<Map<String, dynamic>> shopOwnerLogin(String email, String password) async {
    final response = await _dio.post('/api/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }
  
  // Get Shops
  Future<List<dynamic>> getShops() async {
    final response = await _dio.get('/api/shops');
    return response.data;
  }
  
  // Create Order
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final response = await _dio.post('/api/orders', data: orderData);
    return response.data;
  }
  
  // Upload Files
  Future<List<String>> uploadFiles(List<String> filePaths) async {
    List<String> uploadedFiles = [];
    
    for (String path in filePaths) {
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(path),
      });
      
      final response = await _dio.post('/api/upload', data: formData);
      uploadedFiles.add(response.data['filename']);
    }
    
    return uploadedFiles;
  }
}
```

#### WebSocket Service (services/websocket_service.dart)
```dart
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:printeasy_qr/config/api_config.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();
  
  WebSocketChannel? _channel;
  final _messageCallbacks = <Function>[];
  
  void connect(int userId) {
    final wsUrl = '${ApiConfig.wsUrl}/ws?userId=$userId';
    _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
    
    _channel!.stream.listen(
      (data) {
        final message = json.decode(data);
        _notifyListeners(message);
      },
      onError: (error) {
        print('WebSocket error: $error');
        _reconnect(userId);
      },
      onDone: () {
        print('WebSocket closed');
        _reconnect(userId);
      },
    );
  }
  
  void _reconnect(int userId) {
    Future.delayed(Duration(seconds: 5), () {
      connect(userId);
    });
  }
  
  void sendMessage(Map<String, dynamic> message) {
    if (_channel != null) {
      _channel!.sink.add(json.encode(message));
    }
  }
  
  void addMessageListener(Function callback) {
    _messageCallbacks.add(callback);
  }
  
  void removeMessageListener(Function callback) {
    _messageCallbacks.remove(callback);
  }
  
  void _notifyListeners(Map<String, dynamic> message) {
    for (var callback in _messageCallbacks) {
      callback(message);
    }
  }
  
  void disconnect() {
    _channel?.sink.close();
  }
}
```

### 6. Key Screens Implementation

#### QR Scanner Screen (screens/customer/qr_scanner_screen.dart)
```dart
import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:printeasy_qr/config/theme_config.dart';

class QRScannerScreen extends StatefulWidget {
  @override
  _QRScannerScreenState createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isProcessing = false;
  
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller!.pauseCamera();
    } else if (Platform.isIOS) {
      controller!.resumeCamera();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Scan Shop QR Code'),
        backgroundColor: AppTheme.brandYellow,
        foregroundColor: AppTheme.richBlack,
      ),
      body: Stack(
        children: [
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: AppTheme.brandYellow,
              borderRadius: 20,
              borderLength: 40,
              borderWidth: 10,
              cutOutSize: MediaQuery.of(context).size.width * 0.8,
            ),
          ),
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 10,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.qr_code_scanner,
                          color: AppTheme.brandYellow,
                          size: 32,
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Scan QR Code',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.richBlack,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Point camera at shop QR code',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isProcessing)
                    Container(
                      margin: EdgeInsets.only(top: 20),
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppTheme.brandYellow,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (!isProcessing && scanData.code != null) {
        _processQRCode(scanData.code!);
      }
    });
  }
  
  void _processQRCode(String code) {
    setState(() {
      isProcessing = true;
    });
    
    // Vibrate for feedback
    HapticFeedback.mediumImpact();
    
    // Parse QR code (expected format: https://domain.com/shop/slug)
    final uri = Uri.tryParse(code);
    if (uri != null && uri.pathSegments.length >= 2 && uri.pathSegments[0] == 'shop') {
      final shopSlug = uri.pathSegments[1];
      
      // Navigate to shop details
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ShopDetailsScreen(shopSlug: shopSlug),
        ),
      );
    } else {
      // Invalid QR code
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Invalid QR Code. Please scan a PrintEasy shop QR.'),
          backgroundColor: Colors.red,
        ),
      );
      
      setState(() {
        isProcessing = false;
      });
    }
  }
  
  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
```

#### Customer Dashboard (screens/customer/customer_dashboard.dart)
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:printeasy_qr/providers/auth_provider.dart';
import 'package:printeasy_qr/providers/order_provider.dart';
import 'package:printeasy_qr/widgets/cards/order_card.dart';
import 'package:printeasy_qr/config/theme_config.dart';

class CustomerDashboard extends StatefulWidget {
  @override
  _CustomerDashboardState createState() => _CustomerDashboardState();
}

class _CustomerDashboardState extends State<CustomerDashboard> {
  @override
  void initState() {
    super.initState();
    _loadOrders();
  }
  
  void _loadOrders() {
    final orderProvider = Provider.of<OrderProvider>(context, listen: false);
    orderProvider.fetchCustomerOrders();
  }
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final orderProvider = Provider.of<OrderProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('My Orders'),
        actions: [
          IconButton(
            icon: Icon(Icons.qr_code_scanner),
            onPressed: () {
              Navigator.pushNamed(context, '/qr-scanner');
            },
          ),
          IconButton(
            icon: Icon(Icons.person),
            onPressed: () {
              Navigator.pushNamed(context, '/profile');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.brandYellow,
        onRefresh: () async {
          await orderProvider.fetchCustomerOrders();
        },
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.brandYellow,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(30),
                    bottomRight: Radius.circular(30),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back,',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppTheme.richBlack.withOpacity(0.7),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      authProvider.user?.name ?? 'Customer',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.richBlack,
                      ),
                    ),
                    SizedBox(height: 16),
                    Row(
                      children: [
                        _buildStatCard(
                          'Active Orders',
                          orderProvider.activeOrders.length.toString(),
                          Icons.pending_actions,
                        ),
                        SizedBox(width: 16),
                        _buildStatCard(
                          'Completed',
                          orderProvider.completedOrders.length.toString(),
                          Icons.check_circle,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Quick Actions
              Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Actions',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.richBlack,
                      ),
                    ),
                    SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionCard(
                            'Scan QR',
                            Icons.qr_code_scanner,
                            () => Navigator.pushNamed(context, '/qr-scanner'),
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: _buildActionCard(
                            'Browse Shops',
                            Icons.store,
                            () => Navigator.pushNamed(context, '/browse-shops'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Active Orders
              if (orderProvider.activeOrders.isNotEmpty) ...[
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Active Orders',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.richBlack,
                    ),
                  ),
                ),
                SizedBox(height: 12),
                ...orderProvider.activeOrders.map(
                  (order) => Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: OrderCard(order: order),
                  ),
                ),
              ],
              
              // Empty State
              if (orderProvider.activeOrders.isEmpty && !orderProvider.isLoading)
                Container(
                  padding: EdgeInsets.all(40),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.inbox,
                          size: 80,
                          color: Colors.grey[300],
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No active orders',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[600],
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Scan a QR code to start printing',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/qr-scanner'),
        backgroundColor: AppTheme.brandYellow,
        label: Text(
          'Scan QR',
          style: TextStyle(
            color: AppTheme.richBlack,
            fontWeight: FontWeight.bold,
          ),
        ),
        icon: Icon(
          Icons.qr_code_scanner,
          color: AppTheme.richBlack,
        ),
      ),
    );
  }
  
  Widget _buildStatCard(String title, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(icon, color: AppTheme.richBlack, size: 24),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.richBlack,
                  ),
                ),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildActionCard(String title, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.lightGray,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.grey[300]!,
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: AppTheme.brandYellow,
            ),
            SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.richBlack,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 7. File Upload Implementation
```dart
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:printeasy_qr/services/api_service.dart';

class FileUploadWidget extends StatefulWidget {
  final Function(List<String>) onFilesUploaded;
  
  FileUploadWidget({required this.onFilesUploaded});
  
  @override
  _FileUploadWidgetState createState() => _FileUploadWidgetState();
}

class _FileUploadWidgetState extends State<FileUploadWidget> {
  List<PlatformFile> _selectedFiles = [];
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  
  Future<void> _selectFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'],
    );
    
    if (result != null) {
      setState(() {
        _selectedFiles = result.files;
      });
    }
  }
  
  Future<void> _uploadFiles() async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });
    
    try {
      List<String> filePaths = _selectedFiles
          .where((file) => file.path != null)
          .map((file) => file.path!)
          .toList();
      
      final uploadedFiles = await ApiService().uploadFiles(filePaths);
      widget.onFilesUploaded(uploadedFiles);
      
      setState(() {
        _selectedFiles.clear();
        _isUploading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Files uploaded successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to upload files'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: _isUploading ? null : _selectFiles,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppTheme.brandYellow,
                  width: 2,
                  style: BorderStyle.dashed,
                ),
                borderRadius: BorderRadius.circular(12),
                color: AppTheme.brandYellow.withOpacity(0.05),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.cloud_upload,
                    size: 48,
                    color: AppTheme.brandYellow,
                  ),
                  SizedBox(height: 12),
                  Text(
                    'Tap to select files',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.richBlack,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'PDF, DOC, JPG, PNG (max 500MB)',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          if (_selectedFiles.isNotEmpty) ...[
            SizedBox(height: 16),
            Text(
              'Selected Files (${_selectedFiles.length})',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.richBlack,
              ),
            ),
            SizedBox(height: 8),
            Container(
              constraints: BoxConstraints(maxHeight: 200),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _selectedFiles.length,
                itemBuilder: (context, index) {
                  final file = _selectedFiles[index];
                  return ListTile(
                    leading: Icon(
                      _getFileIcon(file.extension ?? ''),
                      color: AppTheme.brandYellow,
                    ),
                    title: Text(
                      file.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(_formatFileSize(file.size)),
                    trailing: IconButton(
                      icon: Icon(Icons.close, color: Colors.red),
                      onPressed: () {
                        setState(() {
                          _selectedFiles.removeAt(index);
                        });
                      },
                    ),
                  );
                },
              ),
            ),
            
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isUploading ? null : _uploadFiles,
              child: _isUploading
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppTheme.richBlack,
                            ),
                            strokeWidth: 2,
                          ),
                        ),
                        SizedBox(width: 12),
                        Text('Uploading...'),
                      ],
                    )
                  : Text('Upload Files'),
            ),
            
            if (_isUploading)
              LinearProgressIndicator(
                value: _uploadProgress,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppTheme.brandYellow,
                ),
              ),
          ],
        ],
      ),
    );
  }
  
  IconData _getFileIcon(String extension) {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Icons.image;
      default:
        return Icons.insert_drive_file;
    }
  }
  
  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
```

## Dependencies (pubspec.yaml)
```yaml
name: printeasy_qr
description: PrintEasy QR Mobile App
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # Core Dependencies
  dio: ^5.3.2
  provider: ^6.0.5
  shared_preferences: ^2.2.1
  
  # UI & Design
  flutter_svg: ^2.0.7
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  animations: ^2.0.8
  
  # Features
  qr_code_scanner: ^1.0.1
  file_picker: ^5.5.0
  image_picker: ^1.0.4
  web_socket_channel: ^2.4.0
  path_provider: ^2.1.1
  
  # Utilities
  intl: ^0.18.1
  url_launcher: ^6.1.14
  connectivity_plus: ^5.0.1
  permission_handler: ^11.0.1
  
  # Notifications
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.6
  flutter_local_notifications: ^16.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
  
  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
        - asset: assets/fonts/Poppins-Medium.ttf
          weight: 500
        - asset: assets/fonts/Poppins-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Poppins-Bold.ttf
          weight: 700
```

## Build & Deployment

### Android Setup
1. Update `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.printeasyqr.app"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

2. Add permissions in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS Setup
1. Update `ios/Runner/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan QR codes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is required to upload files</string>
```

### Build Commands
```bash
# Debug build
flutter run

# Release build for Android
flutter build apk --release
flutter build appbundle --release

# Release build for iOS
flutter build ios --release
```

## Testing

### Unit Tests
```dart
// test/services/api_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:printeasy_qr/services/api_service.dart';

void main() {
  group('ApiService', () {
    test('login returns user data', () async {
      final apiService = ApiService();
      final result = await apiService.customerLogin('9876543210');
      
      expect(result, isNotNull);
      expect(result['user'], isNotNull);
      expect(result['user']['phone'], equals('9876543210'));
    });
  });
}
```

### Widget Tests
```dart
// test/widgets/order_card_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:printeasy_qr/widgets/cards/order_card.dart';

void main() {
  testWidgets('OrderCard displays order information', (WidgetTester tester) async {
    final order = Order(
      id: 1,
      title: 'Test Order',
      status: 'processing',
      shopName: 'Test Shop',
    );
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: OrderCard(order: order),
        ),
      ),
    );
    
    expect(find.text('Test Order'), findsOneWidget);
    expect(find.text('Test Shop'), findsOneWidget);
    expect(find.text('processing'), findsOneWidget);
  });
}
```

## Troubleshooting

### Common Issues

1. **QR Scanner not working**
   - Ensure camera permissions are granted
   - Check if device has camera hardware
   - Verify QR scanner package is properly installed

2. **WebSocket connection issues**
   - Check network connectivity
   - Verify WebSocket URL is correct
   - Ensure backend WebSocket server is running

3. **File upload failures**
   - Check file size limits
   - Verify storage permissions
   - Ensure network connection is stable

## Support
For technical support or questions:
- Email: its.harshthakar@gmail.com
- Documentation: PROJECT_DOCUMENTATION.md

---
Last Updated: January 2025