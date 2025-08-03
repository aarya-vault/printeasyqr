import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response, 
    error: string, 
    message: string, 
    statusCode = 500, 
    details?: any
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  // Common error responses
  static notFound(res: Response, resource: string): Response {
    return ApiResponse.error(
      res,
      'NOT_FOUND',
      `${resource} not found`,
      404
    );
  }

  static unauthorized(res: Response, message = 'Not authenticated'): Response {
    return ApiResponse.error(
      res,
      'UNAUTHORIZED',
      message,
      401
    );
  }

  static badRequest(res: Response, message: string, details?: any): Response {
    return ApiResponse.error(
      res,
      'BAD_REQUEST',
      message,
      400,
      details
    );
  }

  static serverError(res: Response, message = 'Internal server error', error?: any): Response {
    // Log the actual error but don't expose it to client
    console.error('Server error:', error);
    return ApiResponse.error(
      res,
      'SERVER_ERROR',
      message,
      500
    );
  }
}