const { User, Shop, Order, Message, sequelize } = require('./models');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'its.harshthakar@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '2004@Harsh';
    
    const existingAdmin = await User.findOne({ 
      where: { email: adminEmail } 
    });
    
    if (!existingAdmin) {
      // Create admin user
      await User.create({
        phone: '0000000000',
        email: adminEmail,
        name: 'Admin',
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created successfully');
    }
    
    // Check if we need to create sample data
    const shopCount = await Shop.count();
    
    if (shopCount === 0 && process.env.NODE_ENV === 'development') {
      // Create sample shop owner
      const shopOwnerPassword = await bcrypt.hash('shop123', 12);
      const shopOwner = await User.create({
        phone: '9876543210',
        email: 'printshop@example.com',
        name: 'John Doe',
        passwordHash: shopOwnerPassword,
        role: 'shop_owner',
        isActive: true
      });
      
      // Create sample shop
      const sampleShop = await Shop.create({
        ownerId: shopOwner.id,
        // Public info
        name: 'Quick Print Solutions',
        slug: 'quick-print',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phone: '9876543210',
        publicOwnerName: 'John Doe',
        // Internal info
        internalName: 'Quick Print Main Branch',
        ownerFullName: 'John Doe',
        email: 'printshop@example.com',
        ownerPhone: '9876543210',
        completeAddress: '123 Main Street, Near City Mall, Mumbai 400001',
        // Services
        services: ['Document Printing', 'Photo Printing', 'Binding', 'Lamination'],
        equipment: ['Color Printer', 'B&W Printer', 'Binding Machine'],
        yearsOfExperience: '5-10',
        workingHours: {
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '21:00', closed: false },
          friday: { open: '09:00', close: '21:00', closed: false },
          saturday: { open: '10:00', close: '20:00', closed: false },
          sunday: { open: '10:00', close: '18:00', closed: false }
        },
        acceptsWalkinOrders: true,
        isApproved: true,
        isPublic: true,
        status: 'active',
        isOnline: true
      });
      
      console.log('Sample shop created successfully');
      
      // Create sample customer
      const customer = await User.create({
        phone: '9123456789',
        name: 'Jane Smith',
        role: 'customer',
        isActive: true
      });
      
      // Create sample order
      const sampleOrder = await Order.create({
        customerId: customer.id,
        shopId: sampleShop.id,
        orderNumber: 1,
        type: 'upload',
        title: 'Document Printing',
        description: 'Print 10 copies of project report',
        specifications: {
          copies: 10,
          color: 'black_white',
          binding: 'spiral'
        },
        status: 'new',
        isUrgent: false
      });
      
      // Create sample message
      await Message.create({
        orderId: sampleOrder.id,
        senderId: customer.id,
        senderName: customer.name,
        senderRole: 'customer',
        content: 'Please use good quality paper for the prints.',
        messageType: 'text'
      });
      
      console.log('Sample data created successfully');
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;