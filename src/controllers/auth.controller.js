import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

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

      // Set session
      req.session.user = {
        id: user.id,
        phone: user.phone,
        name: user.name || 'Customer',
        role: user.role
      };
      await req.session.save();

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
        
        req.session.user = {
          id: adminUser.id,
          email: adminUser.email || undefined,
          name: adminUser.name || 'Admin',
          role: adminUser.role
        };
        await req.session.save();
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
          req.session.user = {
            id: user.id,
            email: user.email || undefined,
            name: user.name || 'Shop Owner',
            role: user.role,
            phone: user.phone || undefined
          };
          await req.session.save();
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
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // ALWAYS fetch current user data from database to ensure role is up-to-date
      const currentUser = await User.findByPk(req.session.user.id);
      
      if (!currentUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Update session if role changed (customer → shop_owner transition)
      if (currentUser.role !== req.session.user.role) {
        console.log(`🔄 User ${currentUser.id} role changed: ${req.session.user.role} → ${currentUser.role}`);
        req.session.user = {
          id: currentUser.id,
          phone: currentUser.phone || undefined,
          email: currentUser.email || undefined,
          name: currentUser.name || (currentUser.role === 'customer' ? 'Customer' : 'Shop Owner'),
          role: currentUser.role
        };
        await req.session.save();
      }
      
      // Add needsNameUpdate flag
      const userResponse = {
        ...req.session.user,
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
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  }
}

export default AuthController;