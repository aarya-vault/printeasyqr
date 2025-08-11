import React from 'react';
import { AlertCircle, Code, Zap } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Code className="w-5 h-5 text-blue-500 mt-0.5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-800">Demo Mode Active</h3>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p className="font-medium">WhatsApp OTP Testing Instructions:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Enter any valid 10-digit Indian phone number (starting with 6-9)</li>
              <li>Use any 6-digit number as OTP (e.g., 123456, 999999)</li>
              <li>Order will be processed successfully with demo authentication</li>
              <li>All file uploads and order creation will work as in production</li>
            </ul>
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700">
                <strong>Note:</strong> In production, actual WhatsApp OTPs will be sent via Gupshup API
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}