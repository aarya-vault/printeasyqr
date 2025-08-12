// WhatsApp OTP Service using Gupshup API
import fetch from 'node-fetch';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

const GUPSHUP_API_BASE = 'https://api.gupshup.io';
const OTP_TEMPLATE_ID = 'verification_1'; // Using the working template from your example
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
    console.log(`🚨 WhatsApp OTP Service: sendOTP called with phone: ${phoneNumber}`);
    try {
      // Enhanced phone validation and formatting for Gupshup API
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Debug: Log original and cleaned phone number
      console.log(`🔍 Gupshup Debug - Original phone: ${phoneNumber}, Cleaned: ${cleanPhone}`);
      
      // Accept various formats:
      // - 10 digits starting with any digit (for testing): 1234567890, 9876543210
      // - Already includes country code: 919876543210
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error('Phone number must be 10-15 digits');
      }

      // Format for Gupshup WhatsApp API - exactly as shown in your working example
      let fullPhoneNumber;
      if (cleanPhone.length === 10) {
        // Add country code for Indian numbers (without +)
        fullPhoneNumber = `91${cleanPhone}`;
      } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        // Already has country code
        fullPhoneNumber = cleanPhone;
      } else {
        // Use as is for other international numbers
        fullPhoneNumber = cleanPhone;
      }
      
      console.log(`🔍 Gupshup Debug - Final formatted number: ${fullPhoneNumber}`);
      
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      
      console.log(`🔍 Gupshup Debug - Generated OTP: ${otp} for ${phoneNumber}`);

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
        // Using the sendingAuthenticationTemplate endpoint as shown in your working example
        const apiUrl = `${GUPSHUP_API_BASE}/wa/api/v1/template/msg`;
        const requestBody = {
          channel: 'whatsapp',
          source: process.env.GUPSHUP_SOURCE_PHONE,
          destination: fullPhoneNumber,
          'src.name': process.env.GUPSHUP_APP_NAME,
          template: JSON.stringify({
            id: OTP_TEMPLATE_ID,
            params: [otp, otp] // Two OTP parameters as shown in your working example
          })
        };

        // Debug: Log the full API request
        console.log(`🔍 Gupshup Debug - API URL: ${apiUrl}`);
        console.log(`🔍 Gupshup Debug - Source Phone: ${process.env.GUPSHUP_SOURCE_PHONE}`);
        console.log(`🔍 Gupshup Debug - App Name: ${process.env.GUPSHUP_APP_NAME}`);
        console.log(`🔍 Gupshup Debug - Template ID: ${OTP_TEMPLATE_ID}`);
        console.log(`🔍 Gupshup Debug - Request Body:`, requestBody);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'apikey': process.env.GUPSHUP_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(requestBody)
        });

        result = await response.json();
        
        // Debug: Log the full API response
        console.log(`🔍 Gupshup Debug - Response Status: ${response.status}`);
        console.log(`🔍 Gupshup Debug - Response Body:`, result);
        
        if (response.status !== 202) {
          console.error('❌ Gupshup Template API Failed:', {
            status: response.status,
            response: result,
            destination: fullPhoneNumber,
            source: process.env.GUPSHUP_SOURCE_PHONE
          });
          
          // Try fallback: Simple text message instead of template
          console.log('🔄 Attempting fallback: Simple text message...');
          
          const fallbackResponse = await fetch(`${GUPSHUP_API_BASE}/wa/api/v1/msg`, {
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
              message: `Your PrintEasy QR verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`
            })
          });

          const fallbackResult = await fallbackResponse.json();
          console.log(`🔍 Gupshup Fallback - Response Status: ${fallbackResponse.status}`);
          console.log(`🔍 Gupshup Fallback - Response Body:`, fallbackResult);
          
          if (fallbackResponse.status !== 202) {
            console.error('❌ Gupshup Fallback Also Failed:', fallbackResult);
            throw new Error(fallbackResult.message || `Gupshup API Error: ${fallbackResponse.status}`);
          }
          
          result = fallbackResult;
          console.log(`✅ WhatsApp OTP sent via fallback to ${fullPhoneNumber}:`, result.messageId);
        } else {
          console.log(`✅ WhatsApp OTP sent successfully to ${fullPhoneNumber}:`, result.messageId);
          
          // CRITICAL DEBUG: Try sending a simple text message as well to test delivery
          console.log('🔍 DEBUG: Testing simple text message delivery...');
          try {
            const testResponse = await fetch(`${GUPSHUP_API_BASE}/wa/api/v1/msg`, {
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
                message: `TEST: Your OTP is ${otp}. If you receive this, templates work but delivery is delayed.`
              })
            });
            
            const testResult = await testResponse.json();
            console.log(`🔍 DEBUG Simple Message - Status: ${testResponse.status}, Response:`, testResult);
          } catch (debugError) {
            console.error('🔍 DEBUG Simple Message Failed:', debugError);
          }
        }
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

  // Check delivery status of sent WhatsApp message
  static async checkDeliveryStatus(messageId, phoneNumber) {
    try {
      console.log(`🔍 Checking delivery status for message: ${messageId} to ${phoneNumber}`);
      
      // Gupshup delivery status endpoint
      const statusResponse = await fetch(`${GUPSHUP_API_BASE}/wa/api/v1/msg/${messageId}`, {
        method: 'GET',
        headers: {
          'apikey': process.env.GUPSHUP_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const statusResult = await statusResponse.json();
      console.log(`📊 Delivery Status for ${phoneNumber}:`, statusResult);
      
      if (statusResult.status) {
        switch (statusResult.status.toLowerCase()) {
          case 'delivered':
            console.log(`✅ Message delivered successfully to ${phoneNumber}`);
            break;
          case 'sent':
            console.log(`📤 Message sent to WhatsApp servers for ${phoneNumber}`);
            break;
          case 'failed':
            console.log(`❌ Message delivery failed to ${phoneNumber}:`, statusResult.reason || 'Unknown reason');
            break;
          case 'read':
            console.log(`👀 Message read by user ${phoneNumber}`);
            break;
          default:
            console.log(`📋 Message status for ${phoneNumber}: ${statusResult.status}`);
        }
      }
      
      return statusResult;
    } catch (error) {
      console.error(`❌ Failed to check delivery status for ${phoneNumber}:`, error.message);
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