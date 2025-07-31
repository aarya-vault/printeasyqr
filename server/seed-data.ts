import { db } from "./db";
import { users, shops, orders, shopApplications, notifications } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // No test customer created - only real users should exist
    
    // Create admin user with proper environment variable handling
    const adminEmail = process.env.ADMIN_EMAIL || "admin@printeasy.com";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existingAdmin.length === 0) {
      const [admin] = await db.insert(users).values({
        phone: "9999999999",
        name: "PrintEasy Admin",
        email: adminEmail,
        // passwordHash is null since admin login uses environment variables
        passwordHash: null,
        role: "admin"
      }).returning();
      console.log("Created admin user:", admin.email);
    }

    // No test shop owner or shop created - only real businesses should exist

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Export for use in other modules
export default seedDatabase;