import { db } from "./db";
import { users, shops, orders, shopApplications, notifications } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Create admin user
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@printeasy.com"));
    if (existingAdmin.length === 0) {
      const [admin] = await db.insert(users).values({
        phone: "9999999999",
        name: "PrintEasy Admin",
        email: "admin@printeasy.com",
        password: "admin123",
        role: "admin"
      }).returning();
      console.log("Created admin user:", admin.email);
    }

    // Create shop owner
    const existingShopOwner = await db.select().from(users).where(eq(users.email, "owner@digitalprint.com"));
    if (existingShopOwner.length === 0) {
      const [shopOwner] = await db.insert(users).values({
        phone: "9876543216",
        name: "Digital Print Shop Owner",
        email: "owner@digitalprint.com",
        password: "password",
        role: "shop_owner"
      }).returning();
      console.log("Created shop owner:", shopOwner.email);

      // Create associated shop
      const existingShop = await db.select().from(shops).where(eq(shops.ownerId, shopOwner.id));
      if (existingShop.length === 0) {
        const [shop] = await db.insert(shops).values({
          ownerId: shopOwner.id,
          name: "Digital Print Solutions",
          slug: "digital-print-solutions",
          address: "123 Print Street, Tech Hub",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400001",
          email: "contact@digitalprint.com",
          services: ["document_printing", "photo_printing", "binding", "lamination"],
          workingHours: {
            monday: { open: "09:00", close: "21:00", closed: false },
            tuesday: { open: "09:00", close: "21:00", closed: false },
            wednesday: { open: "09:00", close: "21:00", closed: false },
            thursday: { open: "09:00", close: "21:00", closed: false },
            friday: { open: "09:00", close: "21:00", closed: false },
            saturday: { open: "10:00", close: "18:00", closed: false },
            sunday: { open: "10:00", close: "16:00", closed: false }
          },
          yearsOfExperience: "5+ years",
          qrCode: "https://printeasy.com/shop/digital-print-solutions",
          isOnline: true,
          isApproved: true,
          rating: "4.5",
          totalOrders: 0
        }).returning();
        console.log("Created shop:", shop.name);
      }
    }

    // Create customer user
    const existingCustomer = await db.select().from(users).where(eq(users.phone, "9876543211"));
    if (existingCustomer.length === 0) {
      const [customer] = await db.insert(users).values({
        phone: "9876543211",
        name: "Test Customer",
        role: "customer"
      }).returning();
      console.log("Created customer:", customer.phone);
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Export for use in other modules
export default seedDatabase;