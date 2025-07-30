// Centralized error handling middleware
import { Request, Response, NextFunction } from 'express';
// Simplified error handler without utils dependency

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', error);

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
};