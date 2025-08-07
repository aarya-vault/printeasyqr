import serverless from 'serverless-http';
import { createRequire } from 'module';

// Load the Sequelize app for serverless deployment
const require = createRequire(import.meta.url);
const app = require("../../src/app.js").default;

// Wrap Express app for serverless
export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});