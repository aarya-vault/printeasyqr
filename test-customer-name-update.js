const https = require('https');

// Test customer name update functionality
async function testCustomerNameUpdate() {
  const baseUrl = 'https://2774ded9-e309-485f-8b5f-f177225e8671-00-3b4tr3nnkvtyk.westb.replit.dev';
  
  console.log('🧪 Testing Customer Name Update Flow...\n');

  try {
    // Step 1: Customer phone login
    console.log('1️⃣ Customer Phone Login...');
    const testPhone = `7${Math.floor(100000000 + Math.random() * 900000000)}`;
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/phone-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Login successful - Phone: ${testPhone}`);
    console.log(`✅ needsNameUpdate: ${loginData.needsNameUpdate}`);
    console.log(`✅ JWT Token: ${loginData.token ? 'Present' : 'Missing'}`);
    
    if (!loginData.needsNameUpdate) {
      console.log('❌ Test failed - needsNameUpdate should be true for new customers');
      return false;
    }

    // Step 2: Update customer name using JWT token
    console.log('\n2️⃣ Updating Customer Name...');
    const testName = 'John Customer';
    
    const updateResponse = await fetch(`${baseUrl}/api/users/${loginData.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ name: testName })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`);
    }
    
    const updatedUser = await updateResponse.json();
    console.log(`✅ Name updated successfully: ${updatedUser.name}`);
    console.log(`✅ needsNameUpdate after update: ${updatedUser.needsNameUpdate}`);
    
    // Step 3: Verify name persists in subsequent auth checks
    console.log('\n3️⃣ Verifying Auth State...');
    const authResponse = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!authResponse.ok) {
      throw new Error(`Auth check failed: ${authResponse.status}`);
    }
    
    const authData = await authResponse.json();
    console.log(`✅ Auth check - Name: ${authData.name}`);
    console.log(`✅ needsNameUpdate: ${authData.needsNameUpdate}`);
    
    // Validation
    if (updatedUser.name !== testName) {
      console.log('❌ Test failed - Name not updated correctly');
      return false;
    }
    
    if (updatedUser.needsNameUpdate !== false) {
      console.log('❌ Test failed - needsNameUpdate should be false after name update');
      return false;
    }
    
    if (authData.name !== testName) {
      console.log('❌ Test failed - Name not persisting in auth state');
      return false;
    }
    
    console.log('\n🎉 Customer Name Update Test PASSED!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  }
}

// Node.js fetch polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCustomerNameUpdate();
