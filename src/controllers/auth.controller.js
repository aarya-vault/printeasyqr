import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { generateToken } from '../config/jwt-auth.js';

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

      // Generate JWT token (no session creation)
      const token = generateToken(user.toJSON());
      
      // Add needsNameUpdate flag for customers without names
      const userResponse = {
        ...user.toJSON(),
        needsNameUpdate: user.role === 'customer' && (!user.name || user.name === 'Customer'),
        token // Include JWT token
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