// WhatsApp OTP Service using Gupshup API
import fetch from 'node-fetch';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

const GUPSHUP_API_BASE = 'https://api.gupshup.io';
const OTP_TEMPLATE_ID = 'otp_verification'; // You may need to create this template in Gupshup
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const DEMO_MODE = false; // 🚀 REAL WHATSAPP OTP ENABLED - Using Gupshup API

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

class WhatsAppOTPService {
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  }

  // 🚨 REMOVED: checkExistingSession - This was causing auto-authentication without OTP
  // All authentication must go through proper JWT validation in OTP controller

  static async sendOTP(phoneNumber) {
    try {
      // Enhanced phone validation - flexible for testing and production
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Accept various formats:
      // - 10 digits starting with any digit (for testing): 1234567890, 9876543210
      // - Already includes country code: 919876543210
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Phone number must be 10-15 digits');
      }

      // Format for WhatsApp API - add country code if needed
      const fullPhoneNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Check rate limiting - Demo mode allows faster retries
      const rateLimitMs = DEMO_MODE ? 5000 : 60000; // 5 seconds in demo, 60 seconds in production
      const existingOTP = otpStorage.get(phoneNumber);
      if (existingOTP && existingOTP.lastSentAt) {
        const timeSinceLastOTP = Date.now() - existingOTP.lastSentAt;
        if (timeSinceLastOTP < rateLimitMs) {
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

      // 🚀 REAL WHATSAPP OTP SENDING VIA GUPSHUP API
      let result;
      if (DEMO_MODE) {
        // Demo mode - simulate successful OTP send
        result = {
          status: 'success',
          messageId: `demo-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        console.log(`🔧 DEMO MODE: WhatsApp OTP simulated for ${phoneNumber}, actual OTP: ${otp}`);
      } else {
        // 🚀 PRODUCTION MODE - REAL GUPSHUP API INTEGRATION
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

        result = await response.json();
        
        if (response.status !== 202) {
          console.error('Gupshup API Error:', result);
          throw new Error(result.message || 'Failed to send OTP');
        }

        console.log(`✅ WhatsApp OTP sent to ${phoneNumber}:`, result.messageId);
      }
      
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

      // Verify OTP - Demo mode accepts any 6-digit code
      if (DEMO_MODE) {
        // Demo mode - accept any 6-digit OTP
        if (submittedOTP.length !== 6 || !/^\d{6}$/.test(submittedOTP)) {
          throw new Error('Invalid OTP format');
        }
        console.log(`🔧 DEMO MODE: OTP ${submittedOTP} accepted for ${phoneNumber} (actual was ${storedData.otp})`);
      } else {
        // Production mode - verify actual OTP
        if (storedData.otp !== submittedOTP.toString()) {
          throw new Error('Invalid OTP');
        }
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