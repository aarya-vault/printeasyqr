import { db } from "./db";
import { users, shops, orders, shopApplications, notifications } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Create test customer  
    const existingCustomer = await db.select().from(users).where(eq(users.phone, "9876543211"));
    let customerId: number;
    if (existingCustomer.length === 0) {
      const [customer] = await db.insert(users).values({
        phone: "9876543211",
        name: "Test Customer",
        email: "customer@test.com",
        role: "customer"
      }).returning();
      customerId = customer.id;
      console.log("Created test customer:", customer.phone);
    } else {
      customerId = existingCustomer[0].id;
    }
    
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

      // Create associated shop with comprehensive fields
      const existingShop = await db.select().from(shops).where(eq(shops.ownerId, shopOwner.id));
      if (existingShop.length === 0) {
        const [shop] = await db.insert(shops).values({
          ownerId: shopOwner.id,
          name: "Digital Print Solutions",
          slug: "digital-print-solutions",
          address: "123 Print Street, Tech Hub, Mumbai",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400001",
          phone: "9876543210", // Public contact number
          publicOwnerName: "Rajesh Kumar", // Public name for customer chat
          internalName: "Digital Print Solutions Pvt Ltd",
          ownerFullName: "Rajesh Kumar Singh",
          email: "owner@digitalprint.com",
          ownerPhone: "9876543216", // Owner contact number
          completeAddress: "Shop No. 123, Print Street, Tech Hub, Andheri East, Mumbai, Maharashtra 400001",
          services: JSON.stringify([
            "Color Printing", "B&W Printing", "Photocopying", "Scanning", 
            "Binding", "Lamination", "ID Card Printing", "Photo Printing"
          ]),
          equipment: JSON.stringify([
            "HP LaserJet Pro", "Canon ImageRunner", "Xerox WorkCentre", 
            "Epson EcoTank", "Binding Machine", "Lamination Machine"
          ]),
          yearsOfExperience: "8 years",
          workingHours: JSON.stringify({
            monday: { open: "09:00", close: "21:00", closed: false },
            tuesday: { open: "09:00", close: "21:00", closed: false },
            wednesday: { open: "09:00", close: "21:00", closed: false },
            thursday: { open: "09:00", close: "21:00", closed: false },
            friday: { open: "09:00", close: "21:00", closed: false },
            saturday: { open: "10:00", close: "18:00", closed: false },
            sunday: { open: "10:00", close: "16:00", closed: false }
          }),
          qrCode: "https://printeasy.com/shop/digital-print-solutions",
          acceptsWalkinOrders: true,
          isApproved: true,
          isOnline: true,
          autoAvailability: true,
          isPublic: true,
          totalOrders: 0
        }).returning();
        console.log("Created shop:", shop.name);
        
        // Create test orders for the shop
        const existingOrders = await db.select().from(orders).where(eq(orders.shopId, shop.id));
        if (existingOrders.length === 0) {
          // Create upload order
          const [uploadOrder] = await db.insert(orders).values({
            customerId: customerId,
            shopId: shop.id,
            type: "upload",
            title: "Business Cards - 500 Qty",
            description: "Need 500 business cards printed on premium matte finish paper",
            specifications: JSON.stringify({
              quantity: 500,
              paperType: "Premium Matte",
              size: "Standard",
              sides: "Double-sided"
            }),
            files: JSON.stringify(["business_card_design.pdf"]),
            status: "new",
            isUrgent: false,
            estimatedPages: 1,
            estimatedBudget: "1000"
          }).returning();
          console.log("Created upload order:", uploadOrder.id);
          
          // Create walk-in order
          const [walkinOrder] = await db.insert(orders).values({
            customerId: customerId,
            shopId: shop.id,
            type: "walkin",
            title: "Xerox - 50 Pages",
            description: "Black and white photocopying of documents",
            specifications: JSON.stringify({
              service: "Photocopying",
              pages: 50,
              color: "B&W"
            }),
            walkinTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: "processing",
            isUrgent: true,
            estimatedPages: 50,
            estimatedBudget: "100"
          }).returning();
          console.log("Created walk-in order:", walkinOrder.id);
          
          // Create notifications for orders
          await db.insert(notifications).values([
            {
              userId: shopOwner.id,
              title: "New Order Received",
              message: `New upload order #${uploadOrder.id} from Test Customer`,
              type: "order_update",
              relatedId: uploadOrder.id,
              isRead: false
            },
            {
              userId: shopOwner.id,
              title: "Urgent Walk-in Order",
              message: `Urgent walk-in order #${walkinOrder.id} scheduled for today`,
              type: "order_update",
              relatedId: walkinOrder.id,
              isRead: false
            }
          ]);
          console.log("Created test notifications");
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Export for use in other modules
export default seedDatabase;