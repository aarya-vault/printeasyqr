import { db } from "./db";
import { users, shops, orders, shopApplications, messages } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function createTestData() {
  try {
    console.log("Creating comprehensive test data...");
    
    // 1. Create test shop owner with hashed password
    const hashedPassword = await bcrypt.hash("test123", 12);
    
    const existingShopOwner = await db.select().from(users).where(eq(users.email, "gujaratxerox@gmail.com"));
    let shopOwner;
    
    if (existingShopOwner.length === 0) {
      [shopOwner] = await db.insert(users).values({
        phone: "9123456789",
        name: "Mr. Rajesh Kumar",
        email: "gujaratxerox@gmail.com",
        passwordHash: hashedPassword,
        role: "shop_owner"
      }).returning();
      console.log("Created shop owner:", shopOwner.email);
    } else {
      shopOwner = existingShopOwner[0];
      // Update password hash if needed
      await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, shopOwner.id));
    }

    // 2. Create test shop
    const existingShop = await db.select().from(shops).where(eq(shops.slug, "gujarat-xerox"));
    let shop;
    
    if (existingShop.length === 0) {
      [shop] = await db.insert(shops).values({
        ownerId: shopOwner.id,
        name: "Gujarat Xerox & Stationery",
        slug: "gujarat-xerox",
        address: "Shop No. 5, Krishna Complex",
        city: "Ahmedabad",
        state: "Gujarat",
        pinCode: "380001",
        phone: "9123456789",
        publicOwnerName: "Mr. Rajesh",
        internalName: "Gujarat Xerox Internal",
        ownerFullName: "Rajesh Kumar Patel",
        email: "gujaratxerox@gmail.com",
        ownerPhone: "9123456789",
        completeAddress: "Shop No. 5, Krishna Complex, Near SBI Bank, C.G. Road, Ahmedabad - 380001",
        services: ["Color Printing", "B&W Printing", "Photocopying", "Scanning", "Binding", "Lamination"],
        equipment: ["HP LaserJet Pro", "Canon ImageRunner", "Binding Machine", "Lamination Machine"],
        yearsOfExperience: "10",
        workingHours: {
          monday: { open: "09:00", close: "21:00", closed: false },
          tuesday: { open: "09:00", close: "21:00", closed: false },
          wednesday: { open: "09:00", close: "21:00", closed: false },
          thursday: { open: "09:00", close: "21:00", closed: false },
          friday: { open: "09:00", close: "21:00", closed: false },
          saturday: { open: "10:00", close: "20:00", closed: false },
          sunday: { open: "00:00", close: "00:00", closed: true }
        },
        acceptsWalkinOrders: true,
        isOnline: true,
        autoAvailability: true,
        isApproved: true,
        isPublic: true,
        status: "active"
      }).returning();
      console.log("Created shop:", shop.name);
    } else {
      shop = existingShop[0];
    }

    // 3. Create another test shop (QuickPrint)
    const quickPrintOwner = await db.select().from(users).where(eq(users.email, "quickprint@example.com"));
    let quickPrintUser;
    
    if (quickPrintOwner.length === 0) {
      [quickPrintUser] = await db.insert(users).values({
        phone: "9234567890",
        name: "Ms. Priya Sharma",
        email: "quickprint@example.com",
        passwordHash: hashedPassword,
        role: "shop_owner"
      }).returning();
      console.log("Created QuickPrint owner:", quickPrintUser.email);
    } else {
      quickPrintUser = quickPrintOwner[0];
    }

    const existingQuickPrint = await db.select().from(shops).where(eq(shops.slug, "quickprint-solutions"));
    
    if (existingQuickPrint.length === 0) {
      await db.insert(shops).values({
        ownerId: quickPrintUser.id,
        name: "QuickPrint Solutions",
        slug: "quickprint-solutions",
        address: "Block A, Connaught Place",
        city: "New Delhi",
        state: "Delhi",
        pinCode: "110001",
        phone: "9234567890",
        publicOwnerName: "Ms. Priya",
        internalName: "QuickPrint Internal",
        ownerFullName: "Priya Sharma",
        email: "quickprint@example.com",
        ownerPhone: "9234567890",
        completeAddress: "Block A, Inner Circle, Connaught Place, New Delhi - 110001",
        services: ["Color Printing", "B&W Printing", "Banner Printing", "Visiting Cards", "Flex Printing"],
        equipment: ["Epson EcoTank", "Large Format Printer", "Card Printer"],
        yearsOfExperience: "5",
        workingHours: {
          monday: { open: "00:00", close: "00:00", closed: false }, // 24/7
          tuesday: { open: "00:00", close: "00:00", closed: false },
          wednesday: { open: "00:00", close: "00:00", closed: false },
          thursday: { open: "00:00", close: "00:00", closed: false },
          friday: { open: "00:00", close: "00:00", closed: false },
          saturday: { open: "00:00", close: "00:00", closed: false },
          sunday: { open: "00:00", close: "00:00", closed: false }
        },
        acceptsWalkinOrders: true,
        isOnline: true,
        autoAvailability: false,
        isApproved: true,
        isPublic: true,
        status: "active"
      }).returning();
      console.log("Created QuickPrint Solutions");
    }

    // 4. Create test customer
    const existingCustomer = await db.select().from(users).where(eq(users.phone, "9876543211"));
    let customer;
    
    if (existingCustomer.length === 0) {
      [customer] = await db.insert(users).values({
        phone: "9876543211",
        name: "Test Customer",
        role: "customer"
      }).returning();
      console.log("Created test customer");
    } else {
      customer = existingCustomer[0];
    }

    // 5. Create test orders
    const existingOrders = await db.select().from(orders).where(eq(orders.customerId, customer.id));
    
    if (existingOrders.length === 0) {
      // Create upload order
      const [uploadOrder] = await db.insert(orders).values({
        customerId: customer.id,
        shopId: shop.id,
        type: "upload",
        title: "Business Card Printing",
        description: "Need 500 business cards printed",
        specifications: {
          copies: 500,
          color: "full",
          size: "standard",
          binding: "none",
          urgent: false
        },
        files: JSON.stringify([{
          id: "test-file-1",
          name: "business-card-design.pdf",
          path: "uploads/test-file-1.pdf",
          size: 1024000,
          type: "application/pdf"
        }]),
        status: "processing",
        finalAmount: "0", // No cost as per requirements
        qrCode: null
      }).returning();
      console.log("Created upload order:", uploadOrder.id);

      // Create walk-in order
      const [walkinOrder] = await db.insert(orders).values({
        customerId: customer.id,
        shopId: shop.id,
        type: "walkin",
        title: "Document Printing",
        description: "Will bring documents at shop",
        walkinTime: "2025-01-31T15:00:00",
        status: "new",
        finalAmount: "0",
        qrCode: "walkin-qr-code-data"
      }).returning();
      console.log("Created walk-in order:", walkinOrder.id);

      // Create sample messages
      await db.insert(messages).values([
        {
          orderId: uploadOrder.id,
          senderId: customer.id,
          senderName: customer.name || "Customer",
          senderRole: "customer",
          content: "Hi, when will my business cards be ready?",
          isRead: false
        },
        {
          orderId: uploadOrder.id,
          senderId: shopOwner.id,
          senderName: shopOwner.name || "Shop Owner",
          senderRole: "shop_owner",
          content: "Hello! Your business cards will be ready by tomorrow 5 PM.",
          isRead: false
        }
      ]);
      console.log("Created test messages");
    }

    console.log("Test data creation completed!");
    
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData().then(() => process.exit(0));
}