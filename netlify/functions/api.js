import express from 'express';
import serverless from 'serverless-http';
import app from '../../src/app.js';

// Create a serverless handler from the Express app
const handler = serverless(app, {
  binary: [
    'image/*',
    'application/*',
    'font/*',
    'audio/*',
    'video/*'
  ]
});

export { handler };