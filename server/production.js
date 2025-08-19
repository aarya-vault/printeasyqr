// Production server for deployment
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

// Load environment variables
dotenv.config();

// Disable all database sync in production
process.env.NODE_ENV = "production";
process.env.DISABLE_DB_SYNC = "true";
process.env.DB_SYNC = "false";
process.env.DB_ALTER = "false";
process.env.DB_FORCE = "false";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting PrintEasy QR Production Server");
console.log("🔒 Production Mode: Database sync DISABLED");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from the dist/client directory
const distPath = path.join(__dirname, "..", "dist", "client");
app.use(express.static(distPath));

// Serve uploads directory
const uploadsPath = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

// Initialize and setup the application
async function initializeApp() {
  try {
    // Initialize storage manager
    const { default: storageManager } = await import(
      "./storage/storageManager.js"
    );
    await storageManager.initialize();
    console.log("✅ Storage manager initialized");

    // Load the Sequelize app with all routes
    const { default: sequelizeApp } = await import("../src/app.js");

    // Mount the Sequelize app routes
    app.use("/api", sequelizeApp);
    console.log("✅ API routes loaded successfully");

    // Create HTTP server
    const server = createServer(app);

    // Setup WebSocket server for real-time features
    const { setupWebSocket } = await import("../src/utils/websocket.js");
    setupWebSocket(server);
    console.log("✅ WebSocket server initialized");

    // Catch-all handler for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    // Global error handler
    app.use((error, req, res, next) => {
      console.error("Production Error:", error.message);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    });

    // Start the server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🌐 PrintEasy QR Production Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api/*`);
      console.log("✅ WebSocket enabled for real-time features");
      console.log("🔒 Database: Using existing schema (sync disabled)");
    });
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();
