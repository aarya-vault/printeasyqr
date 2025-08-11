// WhatsApp OTP Service using Gupshup API
import fetch from 'node-fetch';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

const GUPSHUP_API_BASE = 'https://api.gupshup.io';
const OTP_TEMPLATE_ID = 'otp_verification'; // You may need to create this template in Gupshup
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

class WhatsAppOTPService {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  static async sendOTP(phoneNumber) {
    try {
      // Validate Indian phone number format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }

      const fullPhoneNumber = `91${cleanPhone}`;
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Check rate limiting
      const existingOTP = otpStorage.get(phoneNumber);
      if (existingOTP && existingOTP.lastSentAt) {
        const timeSinceLastOTP = Date.now() - existingOTP.lastSentAt;
        if (timeSinceLastOTP < 60000) { // 1 minute cooldown
          throw new Error('Please wait before requesting another OTP');
        }
      }

      // Store OTP with metadata
      otpStorage.set(phoneNumber, {
        otp,
        expiresAt,
        attempts: 0,
        lastSentAt: Date.now()
      });

      // Send WhatsApp OTP via Gupshup API
      const response = await fetch(`${GUPSHUP_API_BASE}/wa/api/v1/template/msg`, {
        method: 'POST',
        headers: {
          'apikey': process.env.GUPSHUP_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          channel: 'whatsapp',
          source: process.env.GUPSHUP_SOURCE_PHONE,
          destination: fullPhoneNumber,
          'src.name': process.env.GUPSHUP_APP_NAME,
          template: JSON.stringify({
            id: OTP_TEMPLATE_ID,
            params: [otp, otp] // OTP twice for body and button component
          })
        })
      });

      const result = await response.json();
      
      if (response.status !== 202) {
        console.error('Gupshup API Error:', result);
        throw new Error(result.message || 'Failed to send OTP');
      }

      console.log(`✅ WhatsApp OTP sent to ${phoneNumber}:`, result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        expiresIn: OTP_EXPIRY_MINUTES
      };

    } catch (error) {
      console.error('WhatsApp OTP Send Error:', error);
      throw error;
    }
  }

  static async verifyOTP(phoneNumber, submittedOTP) {
    try {
      const storedData = otpStorage.get(phoneNumber);
      
      if (!storedData) {
        throw new Error('OTP not found or expired');
      }

      // Check expiry
      if (new Date() > storedData.expiresAt) {
        otpStorage.delete(phoneNumber);
        throw new Error('OTP has expired');
      }

      // Check attempts
      if (storedData.attempts >= MAX_OTP_ATTEMPTS) {
        otpStorage.delete(phoneNumber);
        throw new Error('Maximum OTP attempts exceeded');
      }

      // Increment attempt count
      storedData.attempts += 1;
      otpStorage.set(phoneNumber, storedData);

      // Verify OTP
      if (storedData.otp !== submittedOTP.toString()) {
        throw new Error('Invalid OTP');
      }

      // OTP verified successfully - clean up
      otpStorage.delete(phoneNumber);
      
      console.log(`✅ WhatsApp OTP verified for ${phoneNumber}`);
      
      return {
        success: true,
        verifiedAt: new Date()
      };

    } catch (error) {
      console.error('WhatsApp OTP Verify Error:', error);
      throw error;
    }
  }

  static async checkExistingSession(phoneNumber) {
    try {
      // Check if user has valid JWT token in database
      const user = await User.findOne({
        where: { 
          phone: phoneNumber,
          isActive: true
        }
      });

      if (user) {
        return {
          hasValidSession: true,
          user: user.toJSON()
        };
      }

      return {
        hasValidSession: false,
        user: null
      };

    } catch (error) {
      console.error('Session Check Error:', error);
      return {
        hasValidSession: false,
        user: null
      };
    }
  }

  // Cleanup expired OTPs periodically
  static cleanupExpiredOTPs() {
    const now = new Date();
    for (const [phoneNumber, data] of otpStorage.entries()) {
      if (now > data.expiresAt) {
        otpStorage.delete(phoneNumber);
      }
    }
  }
}

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  WhatsAppOTPService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

export default WhatsAppOTPService;