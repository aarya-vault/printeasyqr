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
      
      if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid phone number format' 
        });
      }

      // Check if user already has a valid session
      const sessionCheck = await WhatsAppOTPService.checkExistingSession(phone);
      
      if (sessionCheck.hasValidSession) {
        // User already authenticated, generate new token
        const token = generateToken(sessionCheck.user);
        const refreshToken = generateRefreshToken(sessionCheck.user);
        
        return res.json({
          success: true,
          message: 'User already authenticated',
          skipOTP: true,
          user: {
            ...sessionCheck.user,
            needsNameUpdate: !sessionCheck.user.name || sessionCheck.user.name === 'Customer'
          },
          token,
          refreshToken
        });
      }

      // Send OTP for new session
      const result = await WhatsAppOTPService.sendOTP(phone);
      
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