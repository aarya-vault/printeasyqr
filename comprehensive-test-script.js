import fs from 'fs/promises';

// Base configuration
const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS_FILE = 'comprehensive-test-results.json';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  categories: {},
  errors: [],
  warnings: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    let responseData = null;
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response');
      }
    } else {
      responseData = await response.text();
    }
    
    return { 
      success: response.ok, 
      data: responseData, 
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 0,
      headers: {}
    };
  }
}

function logTest(name, passed, status, expected, details = null) {
  const statusIcon = passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
  const statusText = passed ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`;
  
  console.log(`\n${statusIcon} ${name}`);
  console.log(`   Status: ${status} ${expected ? `(Expected: ${expected})` : ''} - ${statusText}`);
  
  if (!passed && details) {
    console.log(`   ${colors.yellow}Details: ${JSON.stringify(details, null, 2)}${colors.reset}`);
  }
}

async function testEndpoint(category, name, method, endpoint, data = null, token = null, expectedStatus = 200, validate = null) {
  testResults.totalTests++;
  
  if (!testResults.categories[category]) {
    testResults.categories[category] = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }
  
  testResults.categories[category].total++;
  
  const result = await makeRequest(method, endpoint, data, token);
  const passed = result.success && result.status === expectedStatus && (!validate || validate(result.data));
  
  const testCase = {
    name,
    method,
    endpoint,
    expectedStatus,
    actualStatus: result.status,
    passed,
    response: result.data,
    error: result.error || null,
    timestamp: new Date().toISOString()
  };

  if (passed) {
    testResults.passed++;
    testResults.categories[category].passed++;
  } else {
    testResults.failed++;
    testResults.categories[category].failed++;
    
    testResults.errors.push({
      category,
      test: name,
      error: result.error || `Status mismatch: expected ${expectedStatus}, got ${result.status}`,
      response: result.data,
      status: result.status
    });
  }
  
  testResults.categories[category].tests.push(testCase);
  logTest(name, passed, result.status, expectedStatus, result.error || result.data);
  
  return result;
}

// Main test runner
async function runComprehensiveTests() {
  console.log(`${colors.bright}${colors.cyan}🚀 PrintEasy Comprehensive API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  // Storage for test data
  let tokens = {
    admin: null,
    customer: null,
    shopOwner: null
  };
  
  let testData = {
    adminUser: null,
    customerUser: null,
    shopOwner: null,
    shop: null,
    order: null,
    application: null
  };

  // ========== 1. AUTHENTICATION TESTS ==========
  console.log(`\n${colors.bright}${colors.blue}=== 1. AUTHENTICATION ENDPOINTS ===${colors.reset}`);
  
  // Test admin login
  const adminLogin = await testEndpoint(
    'Authentication',
    'Admin Email Login',
    'POST',
    '/api/auth/email-login',
    { email: 'its.harshthakar@gmail.com', password: '2004@Harsh' },
    null,
    200,
    (data) => data && data.token && data.user
  );
  
  if (adminLogin.success) {
    tokens.admin = adminLogin.data.token;
    testData.adminUser = adminLogin.data.user;
  }

  // Test customer phone login with existing user
  const existingCustomer = await testEndpoint(
    'Authentication',
    'Customer Phone Login (Existing User ID:2)',
    'POST',
    '/api/auth/phone-login',
    { phone: '9876543211', password: 'test123' },
    null,
    200
  );
  
  if (existingCustomer.success && existingCustomer.data.token) {
    tokens.customer = existingCustomer.data.token;
    testData.customerUser = existingCustomer.data.user;
  }

  // Test verify authentication
  await testEndpoint(
    'Authentication',
    'Verify Auth - Admin',
    'GET',
    '/api/auth/me',
    null,
    tokens.admin,
    200,
    (data) => data && data.role === 'admin'
  );

  await testEndpoint(
    'Authentication',
    'Verify Auth - No Token',
    'GET',
    '/api/auth/me',
    null,
    null,
    401
  );

  await testEndpoint(
    'Authentication',
    'Invalid Login - Wrong Password',
    'POST',
    '/api/auth/email-login',
    { email: 'its.harshthakar@gmail.com', password: 'wrongpassword' },
    null,
    401
  );

  // ========== 2. ADMIN ENDPOINTS ==========
  console.log(`\n${colors.bright}${colors.blue}=== 2. ADMIN ENDPOINTS ===${colors.reset}`);

  await testEndpoint(
    'Admin',
    'Get Platform Stats',
    'GET',
    '/api/admin/stats',
    null,
    tokens.admin,
    200,
    (data) => data && typeof data.totalUsers === 'number'
  );

  await testEndpoint(
    'Admin',
    'Platform Stats - Unauthorized (Customer)',
    'GET',
    '/api/admin/stats',
    null,
    tokens.customer,
    403
  );

  const usersResponse = await testEndpoint(
    'Admin',
    'Get All Users',
    'GET',
    '/api/admin/users',
    null,
    tokens.admin,
    200,
    (data) => Array.isArray(data)
  );

  const shopsResponse = await testEndpoint(
    'Admin',
    'Get All Shops',
    'GET',
    '/api/admin/shops',
    null,
    tokens.admin,
    200,
    (data) => Array.isArray(data)
  );

  if (shopsResponse.success && shopsResponse.data.length > 0) {
    testData.shop = shopsResponse.data[0];
  }

  const applicationsResponse = await testEndpoint(
    'Admin',
    'Get Shop Applications',
    'GET',
    '/api/admin/shop-applications',
    null,
    tokens.admin,
    200,
    (data) => Array.isArray(data)
  );

  if (applicationsResponse.success && applicationsResponse.data.length > 0) {
    testData.application = applicationsResponse.data[0];
  }

  // Test shop complete details
  if (testData.shop) {
    await testEndpoint(
      'Admin',
      'Get Shop Complete Details',
      'GET',
      `/api/admin/shops/${testData.shop.id}/complete`,
      null,
      tokens.admin,
      200
    );
  }

  // ========== 3. USER MANAGEMENT ==========
  console.log(`\n${colors.bright}${colors.blue}=== 3. USER MANAGEMENT ===${colors.reset}`);

  if (testData.customerUser) {
    await testEndpoint(
      'User',
      'Get User by ID',
      'GET',
      `/api/users/${testData.customerUser.id}`,
      null,
      tokens.customer,
      200
    );

    await testEndpoint(
      'User',
      'Update User Profile',
      'PATCH',
      `/api/users/${testData.customerUser.id}`,
      { name: 'Updated Test Customer' },
      tokens.customer,
      200
    );

    // Admin user operations
    if (tokens.admin) {
      await testEndpoint(
        'Admin',
        'Admin Update User',
        'PATCH',
        `/api/admin/users/${testData.customerUser.id}`,
        { name: 'Admin Updated Name' },
        tokens.admin,
        200
      );

      await testEndpoint(
        'Admin',
        'Toggle User Status',
        'PATCH',
        `/api/admin/users/${testData.customerUser.id}/status`,
        { isActive: false },
        tokens.admin,
        200
      );

      // Reactivate user
      await testEndpoint(
        'Admin',
        'Reactivate User',
        'PATCH',
        `/api/admin/users/${testData.customerUser.id}/status`,
        { isActive: true },
        tokens.admin,
        200
      );
    }
  }

  // ========== 4. SHOP OPERATIONS ==========
  console.log(`\n${colors.bright}${colors.blue}=== 4. SHOP OPERATIONS ===${colors.reset}`);

  await testEndpoint(
    'Shop',
    'Get Active Shops (Public)',
    'GET',
    '/api/shops',
    null,
    null,
    200,
    (data) => Array.isArray(data)
  );

  if (testData.shop) {
    await testEndpoint(
      'Shop',
      'Get Shop by Slug',
      'GET',
      `/api/shops/slug/${testData.shop.slug}`,
      null,
      null,
      200
    );

    await testEndpoint(
      'Shop',
      'Check Slug Availability',
      'GET',
      `/api/shops/check-slug/new-test-shop`,
      null,
      null,
      200
    );

    // Shop owner operations
    if (testData.shop.ownerId) {
      // Try to get shop owner token
      const shopOwnerLogin = await testEndpoint(
        'Authentication',
        'Shop Owner Login',
        'POST',
        '/api/auth/phone-login',
        { phone: testData.shop.ownerPhone || testData.shop.phone, password: 'shop123' },
        null,
        200
      );
      
      if (shopOwnerLogin.success) {
        tokens.shopOwner = shopOwnerLogin.data.token;
        testData.shopOwner = shopOwnerLogin.data.user;
      }
    }
  }

  // ========== 5. SHOP APPLICATION FLOW ==========
  console.log(`\n${colors.bright}${colors.blue}=== 5. SHOP APPLICATION FLOW ===${colors.reset}`);

  const newApplication = await testEndpoint(
    'Shop Application',
    'Submit New Application',
    'POST',
    '/api/shop-applications',
    {
      publicShopName: 'Test Shop ' + Date.now(),
      shopSlug: 'test-shop-' + Date.now(),
      ownerFullName: 'New Test Owner',
      publicOwnerName: 'Test Owner',
      publicAddress: '456 Test Avenue',
      publicContactNumber: '7777777777',
      internalShopName: 'Internal Test Shop',
      email: `test${Date.now()}@example.com`,
      phoneNumber: '7777777777',
      password: 'testshop123',
      completeAddress: '456 Test Avenue, Test City, Test State 123456',
      city: 'Test City',
      state: 'Test State',
      pinCode: '123456',
      services: ['printing', 'scanning', 'binding'],
      customServices: [],
      equipment: ['laser printer', 'scanner'],
      customEquipment: [],
      yearsOfExperience: '5-10',
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      acceptsWalkinOrders: true
    },
    null,
    200
  );

  if (newApplication.success && newApplication.data.id) {
    const newAppId = newApplication.data.id;
    
    // Admin operations on application
    if (tokens.admin) {
      await testEndpoint(
        'Admin',
        'Get Application Details',
        'GET',
        `/api/shop-applications/${newAppId}`,
        null,
        tokens.admin,
        200
      );

      await testEndpoint(
        'Admin',
        'Reject Application',
        'PATCH',
        `/api/shop-applications/${newAppId}`,
        { status: 'rejected', adminNotes: 'Test rejection' },
        tokens.admin,
        200
      );
    }
  }

  // ========== 6. ORDER MANAGEMENT ==========
  console.log(`\n${colors.bright}${colors.blue}=== 6. ORDER MANAGEMENT ===${colors.reset}`);

  if (testData.shop && tokens.customer) {
    // Create a new order
    const newOrder = await testEndpoint(
      'Order',
      'Create Digital Order',
      'POST',
      '/api/orders',
      {
        shopId: testData.shop.id,
        type: 'digital',
        title: 'Test Print Job',
        description: 'Test order for comprehensive testing',
        specifications: 'A4, Color, 20 pages',
        estimatedPages: 20,
        isUrgent: false
      },
      tokens.customer,
      200
    );

    if (newOrder.success && newOrder.data.id) {
      testData.order = newOrder.data;
      
      // Get order details
      await testEndpoint(
        'Order',
        'Get Order Details',
        'GET',
        `/api/orders/${testData.order.id}`,
        null,
        tokens.customer,
        200
      );

      // Get customer orders
      await testEndpoint(
        'Order',
        'Get Customer Orders',
        'GET',
        `/api/orders/customer/${testData.customerUser.id}`,
        null,
        tokens.customer,
        200
      );

      // Shop owner operations
      if (tokens.shopOwner) {
        await testEndpoint(
          'Order',
          'Get Shop Orders',
          'GET',
          `/api/orders/shop/${testData.shop.id}`,
          null,
          tokens.shopOwner,
          200
        );

        await testEndpoint(
          'Order',
          'Update Order Status',
          'PATCH',
          `/api/orders/${testData.order.id}/status`,
          { status: 'processing' },
          tokens.shopOwner,
          200
        );
      }
    }
  }

  // Anonymous order
  await testEndpoint(
    'Order',
    'Create Anonymous Order',
    'POST',
    '/api/orders/anonymous',
    {
      shopId: testData.shop?.id || 1,
      type: 'walkin',
      title: 'Walk-in Print',
      description: 'Anonymous walk-in order',
      customerPhone: '5555555555',
      customerName: 'Walk-in Customer'
    },
    null,
    200
  );

  // ========== 7. MESSAGING SYSTEM ==========
  console.log(`\n${colors.bright}${colors.blue}=== 7. MESSAGING SYSTEM ===${colors.reset}`);

  if (testData.order && tokens.customer) {
    // Send message
    const sendMessage = await testEndpoint(
      'Message',
      'Send Message',
      'POST',
      '/api/messages',
      {
        orderId: testData.order.id,
        message: 'Test message from customer'
      },
      tokens.customer,
      200
    );

    // Get messages
    await testEndpoint(
      'Message',
      'Get Order Messages',
      'GET',
      `/api/messages/order/${testData.order.id}`,
      null,
      tokens.customer,
      200
    );

    // Get unread count
    await testEndpoint(
      'Message',
      'Get Unread Message Count',
      'GET',
      '/api/messages/unread-count',
      null,
      tokens.customer,
      200
    );

    // Mark messages as read
    await testEndpoint(
      'Message',
      'Mark Messages as Read',
      'PATCH',
      '/api/messages/mark-read',
      { orderId: testData.order.id },
      tokens.customer,
      200
    );
  }

  // ========== 8. ERROR HANDLING TESTS ==========
  console.log(`\n${colors.bright}${colors.blue}=== 8. ERROR HANDLING TESTS ===${colors.reset}`);

  await testEndpoint(
    'Error Handling',
    'Invalid Endpoint',
    'GET',
    '/api/invalid-endpoint',
    null,
    null,
    404
  );

  await testEndpoint(
    'Error Handling',
    'Missing Auth Token',
    'GET',
    '/api/admin/users',
    null,
    null,
    401
  );

  await testEndpoint(
    'Error Handling',
    'Invalid Phone Format',
    'POST',
    '/api/auth/phone-login',
    { phone: '123', password: 'test' },
    null,
    400
  );

  await testEndpoint(
    'Error Handling',
    'Missing Required Fields',
    'POST',
    '/api/orders',
    { shopId: 1 }, // Missing required fields
    tokens.customer,
    400
  );

  await testEndpoint(
    'Error Handling',
    'Invalid Shop ID',
    'GET',
    '/api/shops/slug/non-existent-shop',
    null,
    null,
    404
  );

  // ========== 9. GENERATE SUMMARY ==========
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=== TEST SUMMARY ===${colors.reset}\n`);
  
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`${colors.green}Passed: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed} (${((testResults.failed/testResults.totalTests)*100).toFixed(1)}%)${colors.reset}\n`);

  // Category breakdown
  console.log(`${colors.bright}Category Breakdown:${colors.reset}`);
  for (const [category, stats] of Object.entries(testResults.categories)) {
    const passRate = ((stats.passed/stats.total)*100).toFixed(1);
    const color = passRate >= 80 ? colors.green : passRate >= 50 ? colors.yellow : colors.red;
    console.log(`  ${category}: ${stats.passed}/${stats.total} passed ${color}(${passRate}%)${colors.reset}`);
  }

  // Failed tests details
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.bright}${colors.red}=== FAILED TESTS DETAILS ===${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`\n${colors.red}${index + 1}. [${error.category}] ${error.test}${colors.reset}`);
      console.log(`   Status: ${error.status}`);
      console.log(`   Error: ${error.error}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response, null, 2)}`);
      }
    });
  }

  // Warnings and recommendations
  console.log(`\n${colors.bright}${colors.yellow}=== RECOMMENDATIONS ===${colors.reset}`);
  
  if (testResults.failed > 0) {
    console.log(`${colors.yellow}⚠️  ${testResults.failed} tests failed. Review the error details above.${colors.reset}`);
  }
  
  // Check specific issues
  const authCategory = testResults.categories['Authentication'];
  if (authCategory && authCategory.failed > 0) {
    console.log(`${colors.yellow}⚠️  Authentication issues detected. Check JWT implementation.${colors.reset}`);
  }
  
  const adminCategory = testResults.categories['Admin'];
  if (adminCategory && adminCategory.failed > 0) {
    console.log(`${colors.yellow}⚠️  Admin endpoint issues detected. Check role-based access control.${colors.reset}`);
  }

  // Save detailed results
  await fs.writeFile(
    TEST_RESULTS_FILE,
    JSON.stringify(testResults, null, 2)
  );
  console.log(`\n📄 Detailed results saved to ${TEST_RESULTS_FILE}`);
  console.log(`\nCompleted at: ${new Date().toLocaleString()}`);
}

// Run the comprehensive test suite
runComprehensiveTests().catch(error => {
  console.error(`${colors.red}Fatal error in test suite:${colors.reset}`, error);
  process.exit(1);
});