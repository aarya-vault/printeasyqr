// OTP Authentication Controller
import WhatsAppOTPService from '../services/whatsapp-otp.service.js';
import { User } from '../models/index.js';
import { generateToken, generateRefreshToken } from '../config/jwt-auth.js';
import jwt from 'jsonwebtoken';

class OTPController {
  // Send WhatsApp OTP
  static async sendOTP(req, res) {
    try {
      const { phone } = req.body;
      
      // Enhanced phone validation - flexible for testing and production
      const cleanPhone = phone.replace(/\D/g, '');
      if (!phone || cleanPhone.length < 10 || cleanPhone.length > 15) {
        return res.status(400).json({ 
          success: false,
          message: 'Phone number must be 10-15 digits' 
        });
      }

      // 🚀 SMART JWT TOKEN VALIDATION
      // First check if user exists in database
      const user = await User.findOne({ 
        where: { 
          phone: cleanPhone,
          isActive: true,
          role: 'customer'
        } 
      });

      if (user) {
        console.log('🔍 OTP Controller: Found existing user for phone:', cleanPhone);
        
        // Check if this request has a valid JWT token in headers
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        if (token) {
          try {
            // Verify the JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.phone === cleanPhone) {
              console.log('✅ OTP Controller: Valid JWT token found, skipping OTP');
              
              // Generate fresh tokens
              const newToken = generateToken(user);
              const refreshToken = generateRefreshToken(user);
              
              return res.json({
                success: true,
                message: 'Valid token found, user authenticated',
                skipOTP: true,
                user: {
                  ...user.toJSON(),
                  needsNameUpdate: !user.name || user.name === 'Customer'
                },
                token: newToken,
                refreshToken
              });
            }
          } catch (tokenError) {
            console.log('🔍 OTP Controller: Invalid or expired JWT token');
            // Continue to OTP flow
          }
        }
        
        // If user exists but no valid token, still send OTP for security
        console.log('🔍 OTP Controller: User exists but no valid token, sending OTP for verification');
      } else {
        console.log('🔍 OTP Controller: New user, sending OTP');
      }

      // Send OTP for new session - use cleaned phone number
      console.log(`🔍 OTP Controller: About to call WhatsAppOTPService.sendOTP(${cleanPhone})`);
      const result = await WhatsAppOTPService.sendOTP(cleanPhone);
      console.log(`🔍 OTP Controller: WhatsApp service returned:`, result);
      
      // 🚨 BYPASS MODE: Auto-authenticate user without OTP modal
      if (result.bypassMode) {
        console.log('🚨 BYPASS MODE: Auto-authenticating user without OTP verification');
        
        // Find or create user
        let authenticatedUser = user; // Use existing user if found
        
        if (!authenticatedUser) {
          // Create new customer
          authenticatedUser = await User.create({
            phone: cleanPhone,
            role: 'customer',
            name: 'Customer',
            isActive: true
          });
          console.log(`🔧 BYPASS MODE: Created new user with ID ${authenticatedUser.id}`);
        }
        
        // Generate tokens
        const token = generateToken(authenticatedUser.toJSON());
        const refreshToken = generateRefreshToken(authenticatedUser.toJSON());
        
        const userResponse = {
          ...authenticatedUser.toJSON(),
          needsNameUpdate: !authenticatedUser.name || authenticatedUser.name === 'Customer',
          token,
          refreshToken
        };

        return res.json({
          success: true,
          message: 'Bypass mode: User authenticated automatically',
          bypassMode: true,
          skipOTP: true,
          user: userResponse,
          token,
          refreshToken
        });
      }
      
      res.json({
        success: true,
        message: 'WhatsApp OTP sent successfully',
        skipOTP: false,
        messageId: result.messageId,
        expiresIn: result.expiresIn
      });

    } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP'
      });
    }
  }

  // Verify WhatsApp OTP and authenticate
  static async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ 
          success: false,
          message: 'Phone number and OTP are required' 
        });
      }

      // Verify OTP
      const verification = await WhatsAppOTPService.verifyOTP(phone, otp);
      
      if (!verification.success) {
        throw new Error('OTP verification failed');
      }

      // Find or create user
      let user = await User.findOne({ where: { phone } });
      
      if (user) {
        // Existing user - check role conflicts
        if (user.role === 'shop_owner') {
          return res.status(400).json({
            success: false,
            message: 'This phone number is registered as a shop owner. Please use shop owner login with email and password.',
            errorCode: 'PHONE_BELONGS_TO_SHOP_OWNER',
            redirectTo: '/shop-login'
          });
        }
        
        if (user.role === 'admin') {
          return res.status(400).json({
            success: false,
            message: 'This phone number is registered as admin. Please use admin login.',
            errorCode: 'PHONE_BELONGS_TO_ADMIN'
          });
        }
        
        // Ensure user is active
        if (!user.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Please contact support.',
            errorCode: 'ACCOUNT_DEACTIVATED'
          });
        }
      } else {
        // Create new customer
        user = await User.create({
          phone,
          role: 'customer',
          name: 'Customer',
          isActive: true
        });
      }

      // Generate tokens
      const token = generateToken(user.toJSON());
      const refreshToken = generateRefreshToken(user.toJSON());
      
      const userResponse = {
        ...user.toJSON(),
        needsNameUpdate: !user.name || user.name === 'Customer',
        token,
        refreshToken
      };

      res.json({
        success: true,
        message: 'OTP verified successfully',
        user: userResponse,
        token,
        refreshToken
      });

    } catch (error) {
      console.error('Verify OTP Error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed'
      });
    }
  }

  // Refresh JWT token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'printeasy-jwt-secret-2025');
      
      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newToken = generateToken(user.toJSON());
      const newRefreshToken = generateRefreshToken(user.toJSON());

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
        refreshToken: newRefreshToken,
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Refresh Token Error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }
}

export default OTPController;