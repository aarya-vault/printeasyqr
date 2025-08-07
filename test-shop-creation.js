// Quick script to create a test shop owner user directly in database
import { User } from './src/models/index.js';
import bcrypt from 'bcrypt';

async function createTestShopOwner() {
  try {
    // First check if user exists
    let existingUser = await User.findOne({ where: { email: 'test@shop.com' } });
    
    if (existingUser) {
      console.log('User already exists, updating...');
      // Update existing user
      await existingUser.update({
        role: 'shop_owner',
        passwordHash: 'password123',
        name: 'Test Shop Owner'
      });
      console.log('✅ User updated successfully');
    } else {
      console.log('Creating new shop owner user...');
      // Create new user
      await User.create({
        phone: '8887777777', // Different phone to avoid conflicts
        email: 'test@shop.com',
        name: 'Test Shop Owner',
        role: 'shop_owner',
        passwordHash: 'password123',
        isActive: true
      });
      console.log('✅ Shop owner user created successfully');
    }
    
    // Test the user can login
    const testUser = await User.findOne({ where: { email: 'test@shop.com' } });
    console.log('User found:', testUser ? 'Yes' : 'No');
    console.log('Password hash exists:', testUser?.passwordHash ? 'Yes' : 'No');
    
    if (testUser) {
      const isValid = await testUser.validatePassword('password123');
      console.log('Password validation:', isValid ? 'Success' : 'Failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createTestShopOwner();