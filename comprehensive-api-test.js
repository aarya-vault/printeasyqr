import fs from 'fs/promises';

// Base configuration
const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS_FILE = 'test-results.json';

// Test data
const testData = {
  admin: {
    email: 'its.harshthakar@gmail.com',
    password: '2004@Harsh'
  },
  customer: {
    phone: '9999999999',
    name: 'Test Customer',
    password: 'test123'
  },
  shopOwner: {
    phone: '8888888888',
    name: 'Test Shop Owner',
    email: 'testshop@example.com',
    password: 'shop123'
  },
  shopApplication: {
    publicShopName: 'Test Print Shop',
    shopSlug: 'test-print-shop',
    ownerFullName: 'Test Owner',
    publicOwnerName: 'Test Owner',
    publicAddress: '123 Test Street',
    publicContactNumber: '8888888888',
    internalShopName: 'Test Print Shop Internal',
    email: 'testprintshop@example.com',
    phoneNumber: '8888888888',
    password: 'shop123',
    completeAddress: '123 Test Street, Test City',
    city: 'Test City',
    state: 'Test State',
    pinCode: '123456',
    services: ['printing', 'scanning'],
    customServices: [],
    equipment: ['laser printer'],
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
  }
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  endpoints: {},
  errors: []
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
    const responseData = await response.json().catch(() => null);
    
    return { 
      success: response.ok, 
      data: responseData, 
      status: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: 0
    };
  }
}

async function testEndpoint(name, method, endpoint, data = null, token = null, expectedStatus = 200) {
  console.log(`\\nTesting: ${name}`);
  console.log(`${method} ${endpoint}`);
  
  testResults.totalTests++;
  
  const result = await makeRequest(method, endpoint, data, token);
  
  const testCase = {
    name,
    method,
    endpoint,
    expectedStatus,
    actualStatus: result.status,
    passed: result.success && result.status === expectedStatus,
    response: result.success ? result.data : null,
    error: result.error || null
  };

  if (testCase.passed) {
    console.log(`✅ PASSED - Status: ${result.status}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAILED - Expected: ${expectedStatus}, Got: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${JSON.stringify(result.error)}`);
    }
    testResults.failed++;
    testResults.errors.push({
      test: name,
      error: result.error,
      status: result.status
    });
  }

  if (!testResults.endpoints[endpoint]) {
    testResults.endpoints[endpoint] = [];
  }
  testResults.endpoints[endpoint].push(testCase);

  return result;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Testing for PrintEasy');
  console.log('================================================\\n');

  let adminToken = null;
  let customerToken = null;
  let shopOwnerToken = null;
  let testShopId = null;
  let testUserId = null;
  let testOrderId = null;
  let testApplicationId = null;

  // 1. AUTH ENDPOINTS
  console.log('\\n=== AUTHENTICATION ENDPOINTS ===');
  
  // Test admin login
  const adminLogin = await testEndpoint(
    'Admin Login',
    'POST',
    '/api/auth/email-login',
    testData.admin
  );
  if (adminLogin.success) {
    adminToken = adminLogin.data.token;
  }

  // Test customer login (no signup endpoint in the routes)
  const customerLogin = await testEndpoint(
    'Customer Login',
    'POST',
    '/api/auth/phone-login',
    { phone: testData.customer.phone, password: testData.customer.password }
  );
  if (customerLogin.success) {
    customerToken = customerLogin.data.token;
    testUserId = customerLogin.data.user.id;
  }

  // Test verify auth
  await testEndpoint(
    'Verify Auth - Admin',
    'GET',
    '/api/auth/me',
    null,
    adminToken
  );

  await testEndpoint(
    'Verify Auth - No Token',
    'GET',
    '/api/auth/me',
    null,
    null,
    401
  );

  // 2. ADMIN ENDPOINTS
  console.log('\\n=== ADMIN ENDPOINTS ===');

  await testEndpoint(
    'Admin Stats',
    'GET',
    '/api/admin/stats',
    null,
    adminToken
  );

  await testEndpoint(
    'Admin Stats - Unauthorized',
    'GET',
    '/api/admin/stats',
    null,
    customerToken,
    403
  );

  await testEndpoint(
    'Admin Users List',
    'GET',
    '/api/admin/users',
    null,
    adminToken
  );

  await testEndpoint(
    'Admin Shops List',
    'GET',
    '/api/admin/shops',
    null,
    adminToken
  );

  await testEndpoint(
    'Admin Shop Applications',
    'GET',
    '/api/admin/shop-applications',
    null,
    adminToken
  );

  // 3. SHOP APPLICATION ENDPOINTS
  console.log('\\n=== SHOP APPLICATION ENDPOINTS ===');

  const shopApp = await testEndpoint(
    'Submit Shop Application',
    'POST',
    '/api/shop-applications',
    testData.shopApplication
  );
  if (shopApp.success) {
    testApplicationId = shopApp.data.id;
  }

  await testEndpoint(
    'Get Shop Application',
    'GET',
    `/api/shop-applications/${testApplicationId}`,
    null,
    null
  );

  // 4. SHOP ENDPOINTS
  console.log('\\n=== SHOP ENDPOINTS ===');

  await testEndpoint(
    'Get All Public Shops',
    'GET',
    '/api/shops',
    null,
    null
  );

  await testEndpoint(
    'Get Shop by Invalid Slug',
    'GET',
    '/api/shops/invalid-shop-slug',
    null,
    null,
    404
  );

  // 5. USER ENDPOINTS
  console.log('\\n=== USER ENDPOINTS ===');

  await testEndpoint(
    'Get User by ID',
    'GET',
    `/api/users/${testUserId}`,
    null,
    customerToken
  );

  await testEndpoint(
    'Update User Profile',
    'PATCH',
    `/api/users/${testUserId}`,
    { name: 'Updated Customer Name' },
    customerToken
  );

  // 6. ORDER ENDPOINTS
  console.log('\\n=== ORDER ENDPOINTS ===');

  // First approve a shop application to create a shop
  if (testApplicationId && adminToken) {
    const approveApp = await testEndpoint(
      'Approve Shop Application',
      'PATCH',
      `/api/shop-applications/${testApplicationId}`,
      { status: 'approved', adminNotes: 'Test approval' },
      adminToken
    );
    
    if (approveApp.success) {
      // Get the created shop
      const shops = await makeRequest('GET', '/api/admin/shops', null, adminToken);
      if (shops.success && shops.data.length > 0) {
        testShopId = shops.data[0].id;
        
        // Get shop owner token
        const shopOwnerLogin = await makeRequest('POST', '/api/auth/login', {
          phone: testData.shopApplication.phoneNumber,
          password: testData.shopApplication.password
        });
        if (shopOwnerLogin.success) {
          shopOwnerToken = shopOwnerLogin.data.token;
        }
      }
    }
  }

  // Create order
  if (testShopId && customerToken) {
    const createOrder = await testEndpoint(
      'Create Order',
      'POST',
      '/api/orders',
      {
        shopId: testShopId,
        type: 'digital',
        title: 'Test Print Order',
        description: 'Test order description',
        specifications: 'A4, Color, 10 copies',
        estimatedPages: 10,
        isUrgent: false
      },
      customerToken
    );
    
    if (createOrder.success) {
      testOrderId = createOrder.data.id;
    }
  }

  await testEndpoint(
    'Get Customer Orders',
    'GET',
    '/api/orders',
    null,
    customerToken
  );

  if (testOrderId) {
    await testEndpoint(
      'Get Order Details',
      'GET',
      `/api/orders/${testOrderId}`,
      null,
      customerToken
    );
  }

  // 7. CHAT ENDPOINTS
  console.log('\\n=== CHAT ENDPOINTS ===');

  if (testOrderId && customerToken) {
    await testEndpoint(
      'Send Chat Message',
      'POST',
      '/api/chat/message',
      {
        orderId: testOrderId,
        message: 'Test message from customer'
      },
      customerToken
    );

    await testEndpoint(
      'Get Order Messages',
      'GET',
      `/api/chat/order/${testOrderId}`,
      null,
      customerToken
    );
  }

  // 8. SHOP OWNER ENDPOINTS
  console.log('\\n=== SHOP OWNER ENDPOINTS ===');

  if (shopOwnerToken && testShopId) {
    await testEndpoint(
      'Get Shop Dashboard',
      'GET',
      '/api/shops/dashboard',
      null,
      shopOwnerToken
    );

    await testEndpoint(
      'Get Shop Orders',
      'GET',
      '/api/shops/orders',
      null,
      shopOwnerToken
    );

    if (testOrderId) {
      await testEndpoint(
        'Update Order Status',
        'PATCH',
        `/api/shops/orders/${testOrderId}/status`,
        { status: 'processing' },
        shopOwnerToken
      );
    }
  }

  // 9. ERROR HANDLING TESTS
  console.log('\\n=== ERROR HANDLING TESTS ===');

  await testEndpoint(
    'Invalid Endpoint',
    'GET',
    '/api/invalid-endpoint',
    null,
    null,
    404
  );

  await testEndpoint(
    'Missing Required Fields',
    'POST',
    '/api/auth/phone-login',
    { phone: '1234567890' }, // Missing password
    null,
    400
  );

  await testEndpoint(
    'Invalid Phone Format',
    'POST',
    '/api/auth/phone-login',
    { phone: '123', password: 'test123' },
    null,
    400
  );

  // Generate summary
  console.log('\\n\\n=== TEST SUMMARY ===');
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed} (${((testResults.passed/testResults.totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failed} (${((testResults.failed/testResults.totalTests)*100).toFixed(1)}%)`);

  if (testResults.errors.length > 0) {
    console.log('\\n=== FAILED TESTS ===');
    testResults.errors.forEach(error => {
      console.log(`\\n❌ ${error.test}`);
      console.log(`   Status: ${error.status}`);
      console.log(`   Error: ${JSON.stringify(error.error, null, 2)}`);
    });
  }

  // Save results to file
  await fs.writeFile(
    TEST_RESULTS_FILE,
    JSON.stringify(testResults, null, 2)
  );
  console.log(`\\n📄 Detailed results saved to ${TEST_RESULTS_FILE}`);
}

// Run tests
runAllTests().catch(console.error);