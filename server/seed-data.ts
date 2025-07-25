import { db } from './db';
import { users, shops, orders, messages, shopApplications, notifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await db.delete(notifications);
    await db.delete(messages);
    await db.delete(orders);
    await db.delete(shopApplications);
    await db.delete(shops);
    await db.delete(users);

    console.log('✅ Cleared existing data');

    // Seed Users
    const adminUser = await db.insert(users).values({
      phone: '9876543210',
      name: 'Admin User',
      email: 'admin@printeasy.com',
      role: 'admin'
    }).returning();

    const customerUsers = await db.insert(users).values([
      {
        phone: '9876543211',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        role: 'customer'
      },
      {
        phone: '9876543212',
        name: 'Priya Patel',
        email: 'priya@example.com',
        role: 'customer'
      },
      {
        phone: '9876543213',
        name: 'Amit Kumar',
        email: 'amit@example.com',
        role: 'customer'
      },
      {
        phone: '9876543214',
        name: 'Sneha Gupta',
        email: 'sneha@example.com',
        role: 'customer'
      },
      {
        phone: '9876543215',
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        role: 'customer'
      }
    ]).returning();

    const shopOwners = await db.insert(users).values([
      {
        phone: '9876543216',
        name: 'Digital Print Solutions',
        email: 'owner@digitalprint.com',
        role: 'shop_owner'
      },
      {
        phone: '9876543217',
        name: 'Quick Print Hub',
        email: 'owner@quickprint.com',
        role: 'shop_owner'
      },
      {
        phone: '9876543218',
        name: 'Express Printing Center',
        email: 'owner@expressprint.com',
        role: 'shop_owner'
      },
      {
        phone: '9876543219',
        name: 'Premium Copy Center',
        email: 'owner@premiumcopy.com',
        role: 'shop_owner'
      },
      {
        phone: '9876543220',
        name: 'Modern Print Studio',
        email: 'owner@modernprint.com',
        role: 'shop_owner'
      }
    ]).returning();

    console.log('✅ Seeded users');

    // Seed Shops
    const shopData = [
      {
        ownerId: shopOwners[0].id,
        name: 'Digital Print Solutions',
        slug: 'digital-print-solutions',
        address: '123, Commercial Complex, CG Road, Navrangpura',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380009',
        email: 'contact@digitalprint.com',
        services: ['Document Printing', 'Photo Printing', 'Binding & Lamination', 'Business Cards', 'Large Format Printing'],
        workingHours: {
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '21:00', closed: false },
          friday: { open: '09:00', close: '21:00', closed: false },
          saturday: { open: '09:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
        },
        yearsOfExperience: '8 years',
        rating: 4.8,
        totalOrders: 156,
        isOnline: true,
        isApproved: true,
        qrCode: 'printeasy.com/shop/digital-print-solutions'
      },
      {
        ownerId: shopOwners[1].id,
        name: 'Quick Print Hub',
        slug: 'quick-print-hub',
        address: '456, Market Area, Satellite Road, Paldi',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380007',
        email: 'info@quickprint.com',
        services: ['Document Printing', 'Photocopying', 'Scanning', 'Binding & Lamination', 'Letterheads'],
        workingHours: {
          monday: { open: '08:30', close: '22:00', closed: false },
          tuesday: { open: '08:30', close: '22:00', closed: false },
          wednesday: { open: '08:30', close: '22:00', closed: false },
          thursday: { open: '08:30', close: '22:00', closed: false },
          friday: { open: '08:30', close: '22:00', closed: false },
          saturday: { open: '08:30', close: '21:00', closed: false },
          sunday: { open: '09:00', close: '19:00', closed: false }
        },
        yearsOfExperience: '12 years',
        rating: 4.6,
        totalOrders: 203,
        isOnline: true,
        isApproved: true,
        qrCode: 'printeasy.com/shop/quick-print-hub'
      },
      {
        ownerId: shopOwners[2].id,
        name: 'Express Printing Center',
        slug: 'express-printing-center',
        address: '789, Business District, SG Highway, Bodakdev',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380054',
        email: 'contact@expressprint.com',
        services: ['Document Printing', 'Photo Printing', 'Business Cards', 'Posters', 'Brochures', 'Stationery'],
        workingHours: {
          monday: { open: '09:00', close: '20:00', closed: false },
          tuesday: { open: '09:00', close: '20:00', closed: false },
          wednesday: { open: '09:00', close: '20:00', closed: false },
          thursday: { open: '09:00', close: '20:00', closed: false },
          friday: { open: '09:00', close: '20:00', closed: false },
          saturday: { open: '09:00', close: '19:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        yearsOfExperience: '6 years',
        rating: 4.7,
        totalOrders: 89,
        isOnline: false,
        isApproved: true,
        qrCode: 'printeasy.com/shop/express-printing-center'
      },
      {
        ownerId: shopOwners[3].id,
        name: 'Premium Copy Center',
        slug: 'premium-copy-center',
        address: '321, Tech Park, Vastrapur Lake, Vastrapur',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380015',
        email: 'hello@premiumcopy.com',
        services: ['Document Printing', 'Photocopying', 'Binding & Lamination', 'ID Cards', 'Large Format Printing'],
        workingHours: {
          monday: { open: '09:30', close: '21:30', closed: false },
          tuesday: { open: '09:30', close: '21:30', closed: false },
          wednesday: { open: '09:30', close: '21:30', closed: false },
          thursday: { open: '09:30', close: '21:30', closed: false },
          friday: { open: '09:30', close: '21:30', closed: false },
          saturday: { open: '09:30', close: '20:30', closed: false },
          sunday: { open: '10:30', close: '17:30', closed: false }
        },
        yearsOfExperience: '10 years',
        rating: 4.9,
        totalOrders: 267,
        isOnline: true,
        isApproved: true,
        qrCode: 'printeasy.com/shop/premium-copy-center'
      },
      {
        ownerId: shopOwners[4].id,
        name: 'Modern Print Studio',
        slug: 'modern-print-studio',
        address: '654, Creative Hub, Ellis Bridge, Paldi',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380006',
        email: 'studio@modernprint.com',
        services: ['Photo Printing', 'Business Cards', 'Letterheads', 'Brochures', 'Posters', 'Large Format Printing'],
        workingHours: {
          monday: { open: '10:00', close: '20:00', closed: false },
          tuesday: { open: '10:00', close: '20:00', closed: false },
          wednesday: { open: '10:00', close: '20:00', closed: false },
          thursday: { open: '10:00', close: '20:00', closed: false },
          friday: { open: '10:00', close: '20:00', closed: false },
          saturday: { open: '10:00', close: '19:00', closed: false },
          sunday: { open: '11:00', close: '17:00', closed: false }
        },
        yearsOfExperience: '5 years',
        rating: 4.5,
        totalOrders: 134,
        isOnline: true,
        isApproved: true,
        qrCode: 'printeasy.com/shop/modern-print-studio'
      }
    ];

    const createdShops = await db.insert(shops).values(shopData).returning();
    console.log('✅ Seeded shops');

    // Update shop owners with their shop IDs
    for (let i = 0; i < shopOwners.length; i++) {
      await db.update(users)
        .set({ shopId: createdShops[i].id })
        .where(eq(users.id, shopOwners[i].id));
    }
    console.log('✅ Associated shop owners with their shops');

    // Seed Orders
    const orderData = [
      {
        customerId: customerUsers[0].id,
        shopId: createdShops[0].id,
        type: 'file_upload' as const,
        title: 'Business Presentation Documents',
        description: 'Need 50 copies of presentation slides for client meeting',
        specifications: 'A4 size, color printing, spiral binding',
        files: ['presentation-slides.pdf'],
        status: 'processing' as const,
        estimatedPages: 25,
        estimatedBudget: 1250,
        finalAmount: 1200,
        isUrgent: true
      },
      {
        customerId: customerUsers[1].id,
        shopId: createdShops[1].id,
        type: 'file_upload' as const,
        title: 'Wedding Photo Album',
        description: 'Print wedding photos for album',
        specifications: '4x6 size, matte finish, high quality',
        files: ['wedding-photos.zip'],
        status: 'ready' as const,
        estimatedPages: 100,
        estimatedBudget: 2000,
        finalAmount: 1950,
        isUrgent: false
      },
      {
        customerId: customerUsers[2].id,
        shopId: createdShops[2].id,
        type: 'file_upload' as const,
        title: 'Marketing Brochures',
        description: 'Company brochures for trade show',
        specifications: 'A5 size, glossy paper, folded',
        files: ['brochure-design.pdf'],
        status: 'completed' as const,
        estimatedPages: 1000,
        estimatedBudget: 5000,
        finalAmount: 4800,
        isUrgent: false
      },
      {
        customerId: customerUsers[3].id,
        shopId: createdShops[3].id,
        type: 'file_upload' as const,
        title: 'Thesis Binding',
        description: 'PhD thesis printing and binding',
        specifications: 'A4 size, black & white, hardcover binding',
        files: ['thesis-document.pdf'],
        status: 'new' as const,
        estimatedPages: 200,
        estimatedBudget: 800,
        isUrgent: false
      },
      {
        customerId: customerUsers[4].id,
        shopId: createdShops[4].id,
        type: 'file_upload' as const,
        title: 'Event Posters',
        description: 'Promotional posters for college event',
        specifications: 'A3 size, color printing, matte finish',
        files: ['event-poster.jpg'],
        status: 'processing' as const,
        estimatedPages: 50,
        estimatedBudget: 1500,
        isUrgent: true
      },
      {
        customerId: customerUsers[0].id,
        shopId: createdShops[1].id,
        type: 'walk_in' as const,
        title: 'Document Copies',
        description: 'Photocopy of important documents',
        specifications: 'A4 size, black & white',
        status: 'completed' as const,
        estimatedPages: 20,
        finalAmount: 40,
        isUrgent: false
      },
      {
        customerId: customerUsers[2].id,
        shopId: createdShops[0].id,
        type: 'file_upload' as const,
        title: 'Business Cards',
        description: 'Professional business cards for new company',
        specifications: '350gsm cardstock, matte finish, rounded corners',
        files: ['business-card-design.pdf'],
        status: 'ready' as const,
        estimatedPages: 500,
        estimatedBudget: 2500,
        finalAmount: 2400,
        isUrgent: false
      }
    ];

    const createdOrders = await db.insert(orders).values(orderData).returning();
    console.log('✅ Seeded orders');

    // Seed Shop Applications
    const applicationData = [
      {
        applicantId: customerUsers[0].id,
        shopName: 'City Print Solutions',
        shopSlug: 'city-print-solutions',
        address: '123, New Market, Maninagar',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380008',
        email: 'cityprint@example.com',
        ownerContactName: 'Rajesh Patel',
        ownerEmail: 'rajesh@cityprint.com',
        services: ['Document Printing', 'Photocopying', 'Binding & Lamination'],
        workingHours: {
          monday: { open: '09:00', close: '20:00', closed: false },
          tuesday: { open: '09:00', close: '20:00', closed: false },
          wednesday: { open: '09:00', close: '20:00', closed: false },
          thursday: { open: '09:00', close: '20:00', closed: false },
          friday: { open: '09:00', close: '20:00', closed: false },
          saturday: { open: '09:00', close: '19:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        yearsOfExperience: '7 years',
        status: 'pending' as const
      },
      {
        applicantId: customerUsers[1].id,
        shopName: 'Smart Copy Center',
        shopSlug: 'smart-copy-center',
        address: '456, Technology Park, Bopal',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380058',
        email: 'smartcopy@example.com',
        services: ['Document Printing', 'Photo Printing', 'Large Format Printing', 'Business Cards'],
        workingHours: {
          monday: { open: '08:00', close: '21:00', closed: false },
          tuesday: { open: '08:00', close: '21:00', closed: false },
          wednesday: { open: '08:00', close: '21:00', closed: false },
          thursday: { open: '08:00', close: '21:00', closed: false },
          friday: { open: '08:00', close: '21:00', closed: false },
          saturday: { open: '08:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
        },
        yearsOfExperience: '4 years',
        status: 'approved' as const,
        adminNotes: 'Excellent application with good experience and complete documentation.'
      },
      {
        applicantId: customerUsers[3].id,
        shopName: 'Budget Print Hub',
        shopSlug: 'budget-print-hub',
        address: '789, Local Market, Ghatlodia',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '380061',
        email: 'budgetprint@example.com',
        ownerContactName: 'Neha Shah',
        ownerEmail: 'neha@budgetprint.com',
        services: ['Document Printing', 'Photocopying'],
        workingHours: {
          monday: { open: '09:30', close: '19:30', closed: false },
          tuesday: { open: '09:30', close: '19:30', closed: false },
          wednesday: { open: '09:30', close: '19:30', closed: false },
          thursday: { open: '09:30', close: '19:30', closed: false },
          friday: { open: '09:30', close: '19:30', closed: false },
          saturday: { open: '09:30', close: '18:30', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        yearsOfExperience: '2 years',
        status: 'rejected' as const,
        adminNotes: 'Insufficient experience and limited service offerings. Please reapply after gaining more experience.'
      }
    ];

    const createdApplications = await db.insert(shopApplications).values(applicationData).returning();
    console.log('✅ Seeded shop applications');

    // Seed Messages
    const messageData = [
      {
        orderId: createdOrders[0].id,
        senderId: customerUsers[0].id,
        content: 'Hi, I need these documents by tomorrow morning. Is that possible?',
        messageType: 'text' as const,
        isRead: true
      },
      {
        orderId: createdOrders[0].id,
        senderId: shopOwners[0].id,
        content: 'Yes, we can have them ready by 10 AM tomorrow. We have started processing your order.',
        messageType: 'text' as const,
        isRead: true
      },
      {
        orderId: createdOrders[0].id,
        senderId: customerUsers[0].id,
        content: 'Perfect! Thank you so much.',
        messageType: 'text' as const,
        isRead: false
      },
      {
        orderId: createdOrders[1].id,
        senderId: shopOwners[1].id,
        content: 'Your wedding photos are ready for pickup! They look beautiful.',
        messageType: 'text' as const,
        isRead: false
      },
      {
        orderId: createdOrders[4].id,
        senderId: customerUsers[4].id,
        content: 'Can you please confirm the poster dimensions before printing?',
        messageType: 'text' as const,
        isRead: true
      },
      {
        orderId: createdOrders[4].id,
        senderId: shopOwners[4].id,
        content: 'The posters will be A3 size (297 x 420 mm) as specified. Is that correct?',
        messageType: 'text' as const,
        isRead: false
      }
    ];

    const createdMessages = await db.insert(messages).values(messageData).returning();
    console.log('✅ Seeded messages');

    // Seed Notifications
    const notificationData = [
      {
        userId: customerUsers[0].id,
        title: 'Order Status Updated',
        message: 'Your order "Business Presentation Documents" is now being processed.',
        type: 'order_update' as const,
        relatedId: createdOrders[0].id,
        isRead: false
      },
      {
        userId: customerUsers[1].id,
        title: 'Order Ready for Pickup',
        message: 'Your wedding photo album is ready for pickup at Quick Print Hub.',
        type: 'order_update' as const,
        relatedId: createdOrders[1].id,
        isRead: false
      },
      {
        userId: customerUsers[2].id,
        title: 'Order Completed',
        message: 'Your marketing brochures have been completed. Thank you for choosing us!',
        type: 'order_update' as const,
        relatedId: createdOrders[2].id,
        isRead: true
      },
      {
        userId: shopOwners[0].id,
        title: 'New Order Received',
        message: 'You have received a new urgent order for business presentation documents.',
        type: 'new_order' as const,
        relatedId: createdOrders[0].id,
        isRead: true
      },
      {
        userId: shopOwners[1].id,
        title: 'Customer Message',
        message: 'Customer has sent a message regarding order #' + createdOrders[1].id,
        type: 'message' as const,
        relatedId: createdOrders[1].id,
        isRead: false
      },
      {
        userId: customerUsers[1].id,
        title: 'Shop Application Approved',
        message: 'Congratulations! Your shop application for Smart Copy Center has been approved.',
        type: 'system' as const,
        relatedId: createdApplications[1].id,
        isRead: false
      },
      {
        userId: customerUsers[3].id,
        title: 'Shop Application Rejected',
        message: 'Your shop application for Budget Print Hub has been rejected. Please check admin notes for details.',
        type: 'system' as const,
        relatedId: createdApplications[2].id,
        isRead: false
      }
    ];

    await db.insert(notifications).values(notificationData);
    console.log('✅ Seeded notifications');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeded Data Summary:');
    console.log(`• Users: ${customerUsers.length + shopOwners.length + 1} (1 admin, ${customerUsers.length} customers, ${shopOwners.length} shop owners)`);
    console.log(`• Shops: ${createdShops.length} active shops`);
    console.log(`• Orders: ${createdOrders.length} orders with various statuses`);
    console.log(`• Applications: ${createdApplications.length} shop applications (pending, approved, rejected)`);
    console.log(`• Messages: ${createdMessages.length} chat messages`);
    console.log(`• Notifications: ${notificationData.length} notifications`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('Admin: Phone 9876543210, Email: admin@printeasy.com');
    console.log('Customer: Phone 9876543211, Email: rahul@example.com');
    console.log('Shop Owner: Phone 9876543216, Email: owner@digitalprint.com');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}