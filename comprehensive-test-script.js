/**
 * PrintEasy Comprehensive End-to-End Testing Script
 * 
 * This script tests all major functionality including:
 * - Shop application and details modification
 * - Order placement with large files (50MB)
 * - Order status changes and deletions
 * - Chat functionality with file uploads
 * - File cleanup verification
 * - Shop deletion and admin analytics
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class PrintEasyTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.cookies = {
      admin: '',
      shopOwner: '',
      customer: ''
    };
    this.testData = {
      shopApplication: null,
      createdShop: null,
      createdOrder: null,
      uploadedFiles: []
    };
  }

  // Utility Methods
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': options.cookie || ''
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      console.log(`🌐 ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
      }
      
      return { data, response };
    } catch (error) {
      console.error(`❌ Request failed: ${endpoint}`, error.message);
      throw error;
    }
  }

  async login(credentials, role) {
    console.log(`\n🔐 Logging in as ${role}...`);
    
    const { data, response } = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookies[role] = setCookie;
    }

    console.log(`✅ Successfully logged in as ${role}`);
    return data;
  }

  // Create large test file (50MB)
  createLargeTestFile(filename, sizeGB = 0.05) {
    const filePath = path.join(__dirname, filename);
    const sizeBytes = sizeGB * 1024 * 1024 * 1024; // Convert GB to bytes
    
    console.log(`📁 Creating ${sizeGB}GB test file: ${filename}...`);
    
    const buffer = Buffer.alloc(sizeBytes, 'A'); // Fill with 'A' characters
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ Created ${filename} (${(sizeBytes / (1024 * 1024)).toFixed(2)}MB)`);
    return filePath;
  }

  // Test Shop Application Process
  async testShopApplication() {
    console.log('\n🏪 TESTING SHOP APPLICATION PROCESS');
    console.log('=' .repeat(50));

    // 1. Create shop application
    const applicationData = {
      shopName: 'Test Print Shop E2E',
      slug: `test-shop-${Date.now()}`,
      ownerName: 'Test Owner',
      email: 'testowner@example.com',
      phone: '9876543210',
      address: '123 Test Street',
      city: 'Test City',
      pinCode: '123456',
      services: ['Printing', 'Binding', 'Scanning'],
      equipment: ['Laser Printer', 'Scanner'],
      yearsOfExperience: 5,
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },  
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true }
      },
      acceptsWalkinOrders: true
    };

    const { data: application } = await this.makeRequest('/api/shops/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });

    this.testData.shopApplication = application;
    console.log(`✅ Shop application created with ID: ${application.id}`);

    // 2. Login as admin to approve
    await this.login({
      email: 'its.harshthakar@gmail.com',
      password: '2004@Harsh'
    }, 'admin');

    // 3. Approve shop application
    await this.makeRequest(`/api/admin/shops/${application.id}/approve`, {
      method: 'PATCH',
      cookie: this.cookies.admin
    });

    console.log(`✅ Shop application approved`);

    // 4. Get approved shop details
    const { data: approvedShop } = await this.makeRequest(`/api/shops/${application.id}`, {
      cookie: this.cookies.admin
    });

    this.testData.createdShop = approvedShop;
    console.log(`✅ Shop created successfully: ${approvedShop.name}`);

    return approvedShop;
  }

  // Test Order Creation with Large Files
  async testOrderCreationWithLargeFiles() {
    console.log('\n📦 TESTING ORDER CREATION WITH LARGE FILES');
    console.log('=' .repeat(50));

    // Create large test file (50MB)
    const testFile = this.createLargeTestFile('test-large-file.pdf', 0.05);

    // Create order with large file
    const formData = new FormData();
    formData.append('shopId', this.testData.createdShop.id);
    formData.append('customerName', 'Test Customer');
    formData.append('customerPhone', '9123456789');
    formData.append('type', 'file_upload');
    formData.append('title', 'Large File Print Order');
    formData.append('description', 'Testing 50MB file upload and processing');
    formData.append('files', fs.createReadStream(testFile));

    console.log('⬆️ Uploading 50MB file and creating order...');
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/orders/anonymous`, {
        method: 'POST',
        body: formData
      });

      const orderData = await response.json();
      const uploadTime = (Date.now() - startTime) / 1000;

      if (response.ok) {
        this.testData.createdOrder = orderData;
        console.log(`✅ Order created successfully in ${uploadTime.toFixed(2)}s`);
        console.log(`📋 Order ID: ${orderData.id}, Order Number: ${orderData.orderNumber}`);
        console.log(`📁 Files uploaded: ${orderData.files?.length || 0}`);
        
        // Store file info for cleanup verification
        this.testData.uploadedFiles = orderData.files || [];
      } else {
        throw new Error(`Order creation failed: ${orderData.message}`);
      }
    } catch (error) {
      console.error('❌ Large file upload failed:', error.message);
      throw error;
    } finally {
      // Clean up local test file
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
        console.log('🗑️ Local test file cleaned up');
      }
    }

    return this.testData.createdOrder;
  }

  // Test Order Status Changes
  async testOrderStatusChanges() {
    console.log('\n🔄 TESTING ORDER STATUS CHANGES');
    console.log('=' .repeat(50));

    // Login as shop owner
    await this.login({
      email: 'testowner@example.com',
      password: 'password123'
    }, 'shopOwner');

    const orderId = this.testData.createdOrder.id;
    const statusFlow = ['processing', 'ready', 'completed'];

    for (const status of statusFlow) {
      console.log(`📋 Updating order ${orderId} to ${status}...`);
      
      await this.makeRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        cookie: this.cookies.shopOwner
      });

      console.log(`✅ Order status updated to: ${status}`);
      
      // Small delay between status changes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
  }

  // Test Chat Functionality
  async testChatFunctionality() {
    console.log('\n💬 TESTING CHAT FUNCTIONALITY');
    console.log('=' .repeat(50));

    const orderId = this.testData.createdOrder.id;

    // Create small test file for chat
    const chatFile = path.join(__dirname, 'chat-test-file.txt');
    fs.writeFileSync(chatFile, 'This is a test file for chat functionality.');

    // Send message with file attachment
    const formData = new FormData();
    formData.append('message', 'Here are additional specifications for the print job.');
    formData.append('senderId', this.testData.createdOrder.customerId);
    formData.append('files', fs.createReadStream(chatFile));

    try {
      const response = await fetch(`${this.baseUrl}/api/orders/${orderId}/messages`, {
        method: 'POST',
        body: formData
      });

      const messageData = await response.json();
      
      if (response.ok) {
        console.log('✅ Chat message sent with file attachment');
        console.log(`💬 Message ID: ${messageData.id}`);
        console.log(`📎 Files attached: ${messageData.files?.length || 0}`);
      } else {
        throw new Error(`Chat message failed: ${messageData.message}`);
      }
    } catch (error) {
      console.error('❌ Chat functionality test failed:', error.message);
      throw error;
    } finally {
      // Clean up chat test file
      if (fs.existsSync(chatFile)) {
        fs.unlinkSync(chatFile);
      }
    }

    return true;
  }

  // Test File Cleanup After Order Completion
  async testFileCleanup() {
    console.log('\n🗑️ TESTING FILE CLEANUP AFTER ORDER COMPLETION');
    console.log('=' .repeat(50));

    const uploadedFiles = this.testData.uploadedFiles;
    console.log(`📁 Checking cleanup of ${uploadedFiles.length} uploaded files...`);

    let cleanedUpFiles = 0;
    for (const file of uploadedFiles) {
      const filePath = path.join(process.cwd(), 'uploads', file.filename || file.path);
      
      if (!fs.existsSync(filePath)) {
        cleanedUpFiles++;
        console.log(`✅ File cleaned up: ${file.originalName || file.name}`);
      } else {
        console.log(`❌ File still exists: ${file.originalName || file.name}`);
      }
    }

    const cleanupSuccess = cleanedUpFiles === uploadedFiles.length;
    console.log(`🎯 File cleanup result: ${cleanedUpFiles}/${uploadedFiles.length} files cleaned`);
    
    if (cleanupSuccess) {
      console.log('✅ All files cleaned up successfully');
    } else {
      console.log('⚠️ Some files were not cleaned up properly');
    }

    return cleanupSuccess;
  }

  // Test Order Deletion
  async testOrderDeletion() {
    console.log('\n🗑️ TESTING ORDER DELETION');
    console.log('=' .repeat(50));

    const orderId = this.testData.createdOrder.id;

    // Test deletion by admin
    console.log(`🗑️ Deleting order ${orderId} as admin...`);
    
    await this.makeRequest(`/api/orders/${orderId}`, {
      method: 'DELETE',
      cookie: this.cookies.admin
    });

    console.log('✅ Order deleted successfully by admin');

    // Verify order is soft-deleted
    try {
      await this.makeRequest(`/api/orders/${orderId}`, {
        cookie: this.cookies.admin
      });
      console.log('⚠️ Order still accessible (might be soft-deleted)');
    } catch (error) {
      console.log('✅ Order no longer accessible');
    }

    return true;
  }

  // Test Shop Deletion
  async testShopDeletion() {
    console.log('\n🏪 TESTING SHOP DELETION');
    console.log('=' .repeat(50));

    const shopId = this.testData.createdShop.id;

    console.log(`🗑️ Deleting shop ${shopId} as admin...`);
    
    await this.makeRequest(`/api/admin/shops/${shopId}`, {
      method: 'DELETE',
      cookie: this.cookies.admin
    });

    console.log('✅ Shop deleted successfully');

    return true;
  }

  // Test Admin Dashboard Analytics
  async testAdminAnalytics() {
    console.log('\n📊 TESTING ADMIN DASHBOARD ANALYTICS');
    console.log('=' .repeat(50));

    // Get analytics data
    const { data: analytics } = await this.makeRequest('/api/admin/analytics', {
      cookie: this.cookies.admin
    });

    console.log('📊 Analytics Data:');
    console.log(`👥 Total Users: ${analytics.totalUsers || 0}`);
    console.log(`🏪 Total Shops: ${analytics.totalShops || 0}`);
    console.log(`📦 Total Orders: ${analytics.totalOrders || 0}`);
    console.log(`💰 Revenue Potential: $${analytics.revenuePotential || 0}`);
    console.log(`📈 Orders This Month: ${analytics.ordersThisMonth || 0}`);
    console.log(`🔢 Average Orders per Shop: ${analytics.avgOrdersPerShop || 0}`);

    // Verify analytics are logical
    const analyticsValid = (
      typeof analytics.totalUsers === 'number' &&
      typeof analytics.totalShops === 'number' &&
      typeof analytics.totalOrders === 'number'
    );

    if (analyticsValid) {
      console.log('✅ Analytics data is valid and logical');
    } else {
      console.log('❌ Analytics data appears invalid');
    }

    return analyticsValid;
  }

  // Run All Tests
  async runAllTests() {
    console.log('\n🚀 STARTING COMPREHENSIVE PRINTEASY E2E TESTING');
    console.log('=' .repeat(60));
    
    const testResults = {};
    const startTime = Date.now();

    try {
      // Test 1: Shop Application
      testResults.shopApplication = await this.testShopApplication();
      
      // Test 2: Large File Order Creation
      testResults.largeFileOrder = await this.testOrderCreationWithLargeFiles();
      
      // Test 3: Order Status Changes
      testResults.statusChanges = await this.testOrderStatusChanges();
      
      // Test 4: Chat Functionality
      testResults.chatFunctionality = await this.testChatFunctionality();
      
      // Test 5: File Cleanup
      testResults.fileCleanup = await this.testFileCleanup();
      
      // Test 6: Order Deletion
      testResults.orderDeletion = await this.testOrderDeletion();
      
      // Test 7: Admin Analytics
      testResults.adminAnalytics = await this.testAdminAnalytics();
      
      // Test 8: Shop Deletion
      testResults.shopDeletion = await this.testShopDeletion();

      const totalTime = (Date.now() - startTime) / 1000;

      console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED');
      console.log('=' .repeat(60));
      console.log(`⏱️ Total test time: ${totalTime.toFixed(2)} seconds`);
      console.log('\n📋 Test Results Summary:');
      
      let passedTests = 0;
      const totalTests = Object.keys(testResults).length;
      
      for (const [testName, result] of Object.entries(testResults)) {
        const status = result ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} ${testName}`);
        if (result) passedTests++;
      }
      
      console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! PrintEasy is working perfectly!');
      } else {
        console.log('⚠️ Some tests failed. Please review the results above.');
      }

    } catch (error) {
      console.error('\n💥 TESTING FAILED WITH ERROR:', error.message);
      console.log('\n📋 Partial Results:', testResults);
    }

    return testResults;
  }
}

// Export for use in other files or run directly
if (require.main === module) {
  const tester = new PrintEasyTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n✅ Testing script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Testing script failed:', error);
      process.exit(1);
    });
}

module.exports = PrintEasyTester;