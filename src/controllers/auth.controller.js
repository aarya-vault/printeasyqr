import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { generateToken } from '../config/jwt-auth.js';

class AuthController {
  // Just-in-Time Authentication for Anonymous Orders
  static async justInTimeAuth(req, res) {
    try {
      const { name, phone } = req.body;
      
      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ 
          message: 'Name and phone number are required',
          errorCode: 'MISSING_FIELDS'
        });
      }
      
      // Validate phone format
      if (!/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({ 
          message: 'Invalid phone number format. Please use 10-digit number starting with 6-9',
          errorCode: 'INVALID_PHONE'
        });
      }

      // Check if user exists
      let user = await User.findOne({ where: { phone } });
      let isNewUser = false;
      
      if (user) {
        // Block shop owners and admins from placing orders
        if (user.role === 'shop_owner') {
          return res.status(403).json({ 
            message: 'Shop owners cannot place orders. Please use the shop dashboard.',
            errorCode: 'SHOP_OWNER_CANNOT_ORDER'
          });
        }
        
        if (user.role === 'admin') {
          return res.status(403).json({ 
            message: 'Admins cannot place orders.',
            errorCode: 'ADMIN_CANNOT_ORDER'
          });
        }
        
        // Update name if different
        if (user.name !== name) {
          await user.update({ name });
        }
      } else {
        // Create new customer user
        user = await User.create({
          phone,
          name,
          role: 'customer',
          isActive: true
        });
        isNewUser = true;
      }
      
      // Generate JWT token
      const token = generateToken(user.toJSON());
      
      // Return user data with token
      return res.json({
        token,
        userId: user.id,
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('JIT Auth error:', error);
      res.status(500).json({ 
        message: 'Authentication failed',
        errorCode: 'AUTH_FAILED'
      });
    }
  }

  // Phone login for customers
  static async phoneLogin(req, res) {
    try {
      const { phone } = req.body;
      
      if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }

      // 🔥 COMPREHENSIVE PHONE CONFLICT RESOLUTION
      const existingUser = await User.findOne({ where: { phone } });
      
      if (existingUser) {
        // Check if user is a shop owner
        if (existingUser.role === 'shop_owner') {
          return res.status(400).json({ 
            message: 'This phone number is registered as a shop owner. Please use shop owner login with email and password.',
            errorCode: 'PHONE_BELONGS_TO_SHOP_OWNER',
            redirectTo: '/shop-login'
          });
        }
        
        // Check if user is admin
        if (existingUser.role === 'admin') {
          return res.status(400).json({ 
            message: 'This phone number is registered as admin. Please use admin login.',
            errorCode: 'PHONE_BELONGS_TO_ADMIN'
          });
        }
        
        // If user is already a customer, proceed with login
        if (existingUser.role === 'customer') {
          // Ensure user is active
          if (!existingUser.isActive) {
            return res.status(403).json({ 
              message: 'Your account has been deactivated. Please contact support.',
              errorCode: 'ACCOUNT_DEACTIVATED'
            });
          }
          
          // Generate JWT token and proceed
          const token = generateToken(existingUser.toJSON());
          
          const userResponse = {
            ...existingUser.toJSON(),
            needsNameUpdate: !existingUser.name || existingUser.name === 'Customer',
            token
          };
          
          return res.json(userResponse);
        }
      }
      
      // Create new customer if no existing user found
      const newUser = await User.create({
        phone,
        role: 'customer',
        name: 'Customer', // Default name
        isActive: true
      });

      // Generate JWT token (no session creation)
      const token = generateToken(newUser.toJSON());
      
      // Add needsNameUpdate flag for customers without names
      const userResponse = {
        ...newUser.toJSON(),
        needsNameUpdate: true, // New customers always need name update
        token
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
        
        // Generate JWT token (no session creation)
        const token = generateToken(adminUser.toJSON());
        
        return res.json({
          ...adminUser.toJSON(),
          token
        });
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
          // Generate JWT token (no session creation)
          const token = generateToken(user.toJSON());
          
          return res.json({
            ...user.toJSON(),
            token
          });
        }
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
      console.error('Email login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  // Get current user from JWT
  static async getCurrentUser(req, res) {
    try {
      // requireAuth middleware has already authenticated user via JWT and set req.user
      const currentUser = req.user;
      
      // Return user data with additional flags
      const userResponse = {
        id: currentUser.id,
        phone: currentUser.phone,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        isActive: currentUser.isActive,
        needsNameUpdate: currentUser.role === 'customer' && 
          (!currentUser.name || currentUser.name === 'Customer')
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error('getCurrentUser error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  }

  // Logout - purely client-side with JWT
  static async logout(req, res) {
    try {
      // With JWT, logout is handled client-side by removing the token
      // Server just acknowledges the logout request
      res.json({ 
        message: 'Logged out successfully',
        note: 'Please remove the JWT token from client storage'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  }
}

export default AuthController;