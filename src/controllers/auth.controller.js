import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { SessionHelpers } from '../config/session.js';

class AuthController {
  // Phone login for customers
  static async phoneLogin(req, res) {
    try {
      const { phone } = req.body;
      
      if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }

      // 🔥 PHONE CONFLICT RESOLUTION: Block customer creation if shop owner exists
      const existingShopOwner = await User.findOne({ 
        where: { 
          phone,
          role: 'shop_owner'
        }
      });
      
      if (existingShopOwner) {
        return res.status(400).json({ 
          message: 'This phone number is registered as a shop owner. Please use email login or contact support.' 
        });
      }
      
      // Find or create user
      let user = await User.findOne({ where: { phone } });
      
      if (!user) {
        user = await User.create({
          phone,
          role: 'customer'
        });
      }

      // Create session using helper
      await SessionHelpers.createUserSession(req, {
        id: user.id,
        phone: user.phone,
        name: user.name || 'Customer',
        role: user.role
      });

      // Add needsNameUpdate flag for customers without names
      const userResponse = {
        ...user.toJSON(),
        needsNameUpdate: user.role === 'customer' && (!user.name || user.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('Phone login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  // Email login for shop owners and admin
  static async emailLogin(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Admin login special case
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (email === adminEmail && password === adminPassword) {
        let adminUser = await User.findOne({ where: { email } });
        
        if (!adminUser) {
          adminUser = await User.create({
            phone: "0000000000",
            email: email,
            name: "Admin",
            role: "admin"
          });
        }
        
        await SessionHelpers.createUserSession(req, {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name || 'Admin',
          role: adminUser.role
        });
        return res.json(adminUser);
      }

      // Shop owner login
      const user = await User.findOne({ 
        where: { 
          email,
          role: 'shop_owner'
        }
      });
      
      if (user && user.passwordHash) {
        const isValidPassword = await user.validatePassword(password);
        
        if (isValidPassword) {
          await SessionHelpers.createUserSession(req, {
            id: user.id,
            email: user.email,
            name: user.name || 'Shop Owner',
            role: user.role,
            phone: user.phone
          });
          return res.json(user);
        }
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      // Check session first
      const sessionUser = SessionHelpers.getCurrentUser(req);
      if (!sessionUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Verify user still exists in database
      const currentUser = await User.findByPk(sessionUser.id);
      if (!currentUser) {
        await SessionHelpers.destroyUserSession(req);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Update session if role changed
      if (currentUser.role !== sessionUser.role) {
        console.log(`🔄 Role changed: ${sessionUser.role} → ${currentUser.role}`);
        await SessionHelpers.createUserSession(req, {
          id: currentUser.id,
          phone: currentUser.phone,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role
        });
      }
      
      // Return user data with additional flags
      const userResponse = {
        id: currentUser.id,
        phone: currentUser.phone,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        needsNameUpdate: currentUser.role === 'customer' && 
          (!currentUser.name || currentUser.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('getCurrentUser error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      await SessionHelpers.destroyUserSession(req);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Could not log out' });
    }
  }
}

export default AuthController;