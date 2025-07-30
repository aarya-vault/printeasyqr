// Standardized API response utilities
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  console.error(`API Error [${statusCode}]:`, error, details || '');
  return res.status(statusCode).json(response);
};

export const sendValidationError = (
  res: Response,
  errors: string[] | string,
  statusCode: number = 422
): Response => {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  
  return sendError(res, `Validation failed: ${errorMessage}`, statusCode, {
    validationErrors: Array.isArray(errors) ? errors : [errors]
  });
};

export const sendNotFound = (
  res: Response,
  resource: string = 'Resource'
): Response => {
  return sendError(res, `${resource} not found`, 404);
};

export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = 'Access forbidden'
): Response => {
  return sendError(res, message, 403);
};

export const sendInternalError = (
  res: Response,
  error?: Error | string
): Response => {
  const errorMessage = error instanceof Error ? error.message : error || 'Internal server error';
  
  // Log the full error for debugging
  if (error instanceof Error) {
    console.error('Internal Error:', error.stack);
  }

  return sendError(res, 'Internal server error', 500, {
    ...(process.env.NODE_ENV === 'development' && { originalError: errorMessage })
  });
};

export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): Response => {
  return sendSuccess(res, {
    items: data,
    pagination
  }, message);
};