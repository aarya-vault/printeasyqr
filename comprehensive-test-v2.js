// Comprehensive Test v2 - Fixed Authentication and API Routes
const BASE_URL = 'http://localhost:5000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Test data storage
let testData = {
  adminToken: null,
  shopOwnerToken: null,
  customerToken: null,
  applicationId: null,
  shopId: null,
  shopOwnerId: null,
  customerId: null,
  orderId: null,
  messageId: null,
  shopOwnerPhone: null,
  shopOwnerPassword: null,
  shopOwnerEmail: null
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    credentials: 'include'
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.text();
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData ? JSON.parse(responseData) : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test functions
async function testAdminLogin() {
  console.log(`\n${colors.blue}=== TESTING ADMIN LOGIN ===${colors.reset}`);
  
  const result = await apiRequest('POST', '/api/auth/email-login', {
    email: 'its.harshthakar@gmail.com',
    password: '2004@Harsh'
  });
  
  if (result.ok && result.data.token) {
    testData.adminToken = result.data.token;
    console.log(`${colors.green}✓ Admin login successful${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Admin login failed: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

async function testShopApplication() {
  console.log(`\n${colors.blue}=== TESTING SHOP APPLICATION ===${colors.reset}`);
  
  const uniquePhone = `987${Date.now().toString().slice(-7)}`;
  const uniqueSlug = `test-shop-${Date.now()}`;
  
  testData.shopOwnerPhone = uniquePhone;
  testData.shopOwnerPassword = 'Shop@123';
  testData.shopOwnerEmail = `testshop${Date.now()}@example.com`;
  
  const applicationData = {
    publicShopName: "Test Print Shop " + Date.now(),
    shopSlug: uniqueSlug,
    ownerFullName: "Test Shop Owner",
    publicOwnerName: "Test Public Owner",
    publicAddress: "123 Test Street",
    publicContactNumber: uniquePhone,
    internalShopName: "Test Internal Shop",
    email: testData.shopOwnerEmail,
    phoneNumber: uniquePhone,
    password: testData.shopOwnerPassword,
    completeAddress: "123 Test Street, Test City",
    city: "Test City",
    state: "Test State",
    pinCode: "123456",
    services: ["printing", "scanning", "binding"],
    customServices: [],
    equipment: ["laser printer", "scanner"],
    customEquipment: [],
    yearsOfExperience: "5+",
    workingHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "14:00" },
      sunday: { closed: true }
    },
    acceptsWalkinOrders: true
  };
  
  const result = await apiRequest('POST', '/api/shop-applications', applicationData);
  
  if (result.ok && result.data.id) {
    testData.applicationId = result.data.id;
    console.log(`${colors.green}✓ Shop application created (ID: ${result.data.id})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Shop application failed: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

async function testApplicationApproval() {
  console.log(`\n${colors.blue}=== TESTING APPLICATION APPROVAL ===${colors.reset}`);
  
  const result = await apiRequest('PATCH', `/api/admin/shop-applications/${testData.applicationId}`, {
    status: 'approved',
    adminNotes: 'Approved for testing'
  }, testData.adminToken);
  
  if (result.ok) {
    console.log(`${colors.green}✓ Application approved successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Application approval failed: ${result.data?.message || result.error}${colors.reset}`);
    console.log(`Status: ${result.status}, Response:`, result.data);
    return false;
  }
}

async function testShopOwnerLogin() {
  console.log(`\n${colors.blue}=== TESTING SHOP OWNER LOGIN ===${colors.reset}`);
  
  // Wait a bit for the shop owner account to be created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const result = await apiRequest('POST', '/api/auth/email-login', {
    email: testData.shopOwnerEmail,
    password: testData.shopOwnerPassword
  });
  
  if (result.ok && result.data.token) {
    testData.shopOwnerToken = result.data.token;
    testData.shopOwnerId = result.data.id;
    console.log(`${colors.green}✓ Shop owner login successful (ID: ${result.data.id})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Shop owner login failed: ${result.data?.message || result.error}${colors.reset}`);
    console.log(`Attempted with phone: ${testData.shopOwnerPhone}`);
    return false;
  }
}

async function testGetShopDetails() {
  console.log(`\n${colors.blue}=== TESTING GET SHOP DETAILS ===${colors.reset}`);
  
  const result = await apiRequest('GET', `/api/shops/owner/${testData.shopOwnerId}`, null, testData.shopOwnerToken);
  
  if (result.ok && result.data.shop) {
    testData.shopId = result.data.shop.id;
    console.log(`${colors.green}✓ Shop details retrieved (ID: ${result.data.shop.id}, Slug: ${result.data.shop.slug})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get shop details: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

async function testCustomerRegistration() {
  console.log(`\n${colors.blue}=== TESTING CUSTOMER REGISTRATION ===${colors.reset}`);
  
  const phone = `777${Date.now().toString().slice(-7)}`;
  
  const result = await apiRequest('POST', '/api/auth/phone-login', {
    phone: phone,
    password: 'customer123'
  });
  
  if (result.ok && result.data.token) {
    testData.customerToken = result.data.token;
    testData.customerId = result.data.id;
    console.log(`${colors.green}✓ Customer registered successfully (ID: ${result.data.id})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Customer registration failed: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

async function testCreateOrder() {
  console.log(`\n${colors.blue}=== TESTING ORDER CREATION ===${colors.reset}`);
  
  const orderData = {
    shopId: testData.shopId,
    type: 'digital',
    title: 'Test Print Order',
    description: 'Testing order creation with multiple files',
    specifications: 'A4, Color, 100 pages',
    estimatedPages: 100,
    isUrgent: true
  };
  
  const result = await apiRequest('POST', '/api/orders', orderData, testData.customerToken);
  
  if (result.ok && result.data.id) {
    testData.orderId = result.data.id;
    console.log(`${colors.green}✓ Order created successfully (ID: ${result.data.id})${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Order creation failed: ${result.data?.message || result.error}${colors.reset}`);
    console.log('Response:', result);
    return false;
  }
}

async function testSendMessage() {
  console.log(`\n${colors.blue}=== TESTING MESSAGE SYSTEM ===${colors.reset}`);
  
  const messageData = {
    orderId: testData.orderId,
    senderId: testData.customerId,
    senderName: 'Test Customer',
    senderRole: 'customer',
    content: 'This is a test message from customer',
    messageType: 'text'
  };
  
  const result = await apiRequest('POST', '/api/messages', messageData, testData.customerToken);
  
  if (result.ok && result.data.id) {
    testData.messageId = result.data.id;
    console.log(`${colors.green}✓ Message sent successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Message sending failed: ${result.data?.message || result.error}${colors.reset}`);
    console.log('Response:', result);
    return false;
  }
}

async function testUnreadMessageCount() {
  console.log(`\n${colors.blue}=== TESTING UNREAD MESSAGE COUNT ===${colors.reset}`);
  
  const result = await apiRequest('GET', `/api/messages/unread-count`, null, testData.shopOwnerToken);
  
  if (result.ok && typeof result.data.unreadCount === 'number') {
    console.log(`${colors.green}✓ Unread count retrieved: ${result.data.unreadCount}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get unread count: ${result.data?.message || result.error}${colors.reset}`);
    console.log('Response:', result);
    return false;
  }
}

async function testOrderStatusUpdate() {
  console.log(`\n${colors.blue}=== TESTING ORDER STATUS UPDATE ===${colors.reset}`);
  
  const result = await apiRequest('PATCH', `/api/orders/${testData.orderId}/status`, {
    status: 'processing'
  }, testData.shopOwnerToken);
  
  if (result.ok) {
    console.log(`${colors.green}✓ Order status updated to processing${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Status update failed: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

async function testAdminAnalytics() {
  console.log(`\n${colors.blue}=== TESTING ADMIN ANALYTICS ===${colors.reset}`);
  
  const statsResult = await apiRequest('GET', '/api/admin/stats', null, testData.adminToken);
  const revenueResult = await apiRequest('GET', '/api/admin/revenue-analytics', null, testData.adminToken);
  
  if (statsResult.ok && revenueResult.ok) {
    console.log(`${colors.green}✓ Admin analytics retrieved successfully${colors.reset}`);
    console.log(`  - Total users: ${statsResult.data.totalUsers}`);
    console.log(`  - Total shops: ${statsResult.data.totalShops}`);
    console.log(`  - Total orders: ${statsResult.data.totalOrders}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get analytics${colors.reset}`);
    return false;
  }
}

async function testDeleteOrder() {
  console.log(`\n${colors.blue}=== TESTING ORDER DELETION ===${colors.reset}`);
  
  const result = await apiRequest('DELETE', `/api/orders/${testData.orderId}`, null, testData.customerToken);
  
  if (result.ok) {
    console.log(`${colors.green}✓ Order deleted successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Order deletion failed: ${result.data?.message || result.error}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}COMPREHENSIVE TEST V2${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Started at: ${new Date().toLocaleString()}\n`);
  
  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Shop Application', fn: testShopApplication },
    { name: 'Application Approval', fn: testApplicationApproval },
    { name: 'Shop Owner Login', fn: testShopOwnerLogin },
    { name: 'Get Shop Details', fn: testGetShopDetails },
    { name: 'Customer Registration', fn: testCustomerRegistration },
    { name: 'Create Order', fn: testCreateOrder },
    { name: 'Send Message', fn: testSendMessage },
    { name: 'Unread Message Count', fn: testUnreadMessageCount },
    { name: 'Order Status Update', fn: testOrderStatusUpdate },
    { name: 'Admin Analytics', fn: testAdminAnalytics },
    { name: 'Delete Order', fn: testDeleteOrder }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        console.log(`${colors.yellow}⚠️  Stopping at ${test.name} due to failure${colors.reset}`);
        break;
      }
    } catch (error) {
      failed++;
      console.log(`${colors.red}✗ ${test.name} threw error: ${error.message}${colors.reset}`);
      break;
    }
  }
  
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}/${tests.length}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  
  // Output test data for debugging
  if (failed > 0) {
    console.log(`\n${colors.blue}Test Data for Debugging:${colors.reset}`);
    console.log(JSON.stringify(testData, null, 2));
  }
}

// Run the tests
runTests().catch(console.error);