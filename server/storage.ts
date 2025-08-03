import { 
  users, shops, orders, messages, shopApplications, notifications, customerShopUnlocks,
  type User, type InsertUser, type Shop, type InsertShop, 
  type Order, type InsertOrder, type Message, type InsertMessage,
  type ShopApplication, type InsertShopApplication, type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ne, isNull } from "drizzle-orm";
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Shop operations
  getShop(id: number): Promise<Shop | undefined>;
  getShopByOwnerId(ownerId: number): Promise<Shop | undefined>;
  getShopByEmail(email: string): Promise<Shop | undefined>;
  getShopsByOwner(ownerId: number): Promise<Shop[]>;
  getActiveShops(): Promise<Shop[]>;
  getAllShops(): Promise<Shop[]>;
  getVisitedShopsByCustomer(customerId: number): Promise<Shop[]>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: number, updates: Partial<Shop>): Promise<Shop | undefined>;
  updateShopSettings(shopId: number, settings: any): Promise<Shop>;
  getShopBySlug(slug: string): Promise<Shop | undefined>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByShop(shopId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: number, deletedBy?: number): Promise<boolean>;
  deleteOrderFiles(orderId: number): Promise<void>;
  
  // Message operations
  getMessagesByOrder(orderId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(orderId: number, userId: number): Promise<void>;
  
  // Shop application operations
  getShopApplication(id: number): Promise<ShopApplication | undefined>;
  getPendingShopApplications(): Promise<ShopApplication[]>;
  getAllShopApplications(): Promise<ShopApplication[]>;
  createShopApplication(application: InsertShopApplication): Promise<ShopApplication>;
  updateShopApplication(id: number, updates: Partial<ShopApplication>): Promise<ShopApplication | undefined>;
  checkShopSlugAvailability(slug: string): Promise<boolean>;
  updateShopApplicationStatus(id: number, status: string, adminNotes?: string): Promise<ShopApplication>;
  
  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Analytics operations
  getPlatformStats(): Promise<{
    totalUsers: number;
    activeShops: number;
    totalOrders: number;
  }>;

  // Admin shop management operations
  updateShopStatus(shopId: number, status: 'active' | 'deactivated' | 'banned'): Promise<void>;
  deleteShop(shopId: number): Promise<void>;

  // Security operations
  hashPassword(password: string): Promise<string>;

  // Customer shop unlock operations
  unlockShopForCustomer(customerId: number, shopId: number, qrScanLocation?: string): Promise<{ shopId: number; shopName: string }>;
  getUnlockedShopsByCustomer(customerId: number): Promise<number[]>;
  isShopUnlockedForCustomer(customerId: number, shopId: number): Promise<boolean>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    // Remove any updatedAt from updates to avoid type conflicts
    const { updatedAt, ...cleanUpdates } = updates as any;
    
    const [updatedUser] = await db.update(users)
      .set({
        ...cleanUpdates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }



  async getShop(id: number): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
    return shop || undefined;
  }

  async getShopByOwnerId(ownerId: number): Promise<Shop | undefined> {
    try {
      const [shop] = await db
        .select()
        .from(shops)
        .where(eq(shops.ownerId, ownerId))
        .limit(1);
      return shop || undefined;
    } catch (error) {
      console.error('Error fetching shop by owner ID:', error);
      return undefined;
    }
  }

  async getShopByEmail(email: string): Promise<any> {
    // Get shop application by email (contains password hash)
    const [application] = await db
      .select()
      .from(shopApplications)
      .where(and(
        eq(shopApplications.email, email),
        eq(shopApplications.status, 'approved')
      ));
    
    if (!application) return undefined;
    
    // Get the actual shop
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerId, application.applicantId));
    
    if (!shop) return undefined;
    
    // Return combined data
    return {
      ...shop,
      email: application.email,
      password: application.password,
      ownerFullName: application.ownerFullName,
      ownerPhone: application.phoneNumber
    };
  }

  async getShopsByOwner(ownerId: number): Promise<Shop[]> {
    return await db.select().from(shops).where(eq(shops.ownerId, ownerId));
  }

  async getActiveShops(): Promise<Shop[]> {
    return await db
      .select()
      .from(shops)
      .where(and(eq(shops.isApproved, true), eq(shops.isOnline, true)))
      .orderBy(desc(shops.rating));
  }

  async getAllShops(): Promise<Shop[]> {
    return await db
      .select()
      .from(shops)
      .where(eq(shops.isApproved, true))
      .orderBy(desc(shops.rating));
  }

  async createShop(insertShop: InsertShop): Promise<Shop> {
    const [shop] = await db
      .insert(shops)
      .values({
        ...insertShop,
        status: (insertShop as any).status || 'active'
      })
      .returning();
    return shop;
  }

  async updateShop(id: number, updates: Partial<Shop>): Promise<Shop | undefined> {
    const [shop] = await db
      .update(shops)
      .set({
        ...updates,
        status: updates.status as any,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();
    
    // Sync business information back to application if shop owner updates
    if (shop && this.isBusinessInformationUpdate(updates)) {
      await this.syncApplicationFromShop(id);
    }
    
    return shop || undefined;
  }

  // Check if updates contain business information that should sync to application
  private isBusinessInformationUpdate(updates: Partial<Shop>): boolean {
    const businessFields = [
      'name', 'address', 'phone', 'publicOwnerName', 'email', 
      'city', 'state', 'pinCode', 'services', 'equipment', 
      'yearsOfExperience', 'workingHours', 'ownerFullName', 'ownerPhone'
    ];
    return businessFields.some(field => field in updates);
  }

  async getShopBySlug(slug: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.slug, slug));
    return shop || undefined;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(
      and(
        eq(orders.id, id),
        isNull(orders.deletedAt) // Exclude soft deleted orders
      )
    );
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    try {
      const orderList = await db
        .select({
          order: orders,
          shop: {
            id: shops.id,
            name: shops.name,
            phone: shops.phone,
            publicContactNumber: shops.phone, // Using phone for now
            publicAddress: shops.address,
            city: shops.city,
          }
        })
        .from(orders)
        .leftJoin(shops, eq(orders.shopId, shops.id))
        .where(
          and(
            eq(orders.customerId, customerId),
            isNull(orders.deletedAt) // Exclude soft deleted orders
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(50); // Limit for performance

      return orderList.map(row => ({
        ...row.order,
        shop: row.shop
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders by customer:', error);
      return [];
    }
  }

  async getOrdersByShop(shopId: number): Promise<Order[]> {
    try {
      const orderList = await db
        .select({
          order: orders,
          customer: {
            id: users.id,
            name: users.name,
            phone: users.phone,
          }
        })
        .from(orders)
        .leftJoin(users, eq(orders.customerId, users.id))
        .where(
          and(
            eq(orders.shopId, shopId),
            isNull(orders.deletedAt) // Exclude soft deleted orders
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(50); // Limit for performance

      return orderList.map(row => ({
        ...row.order,
        customerName: row.customer?.name || '',
        customerPhone: row.customer?.phone || '',
      })) as Order[];
    } catch (error) {
      console.error('Error fetching orders by shop:', error);
      return [];
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Get the next order number for this shop
    const [lastOrder] = await db
      .select({ maxOrderNumber: sql<number>`MAX(order_number)` })
      .from(orders)
      .where(eq(orders.shopId, insertOrder.shopId));
    
    const nextOrderNumber = (lastOrder?.maxOrderNumber || 0) + 1;
    
    const [order] = await db
      .insert(orders)
      .values({
        ...insertOrder,
        orderNumber: nextOrderNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getMessagesByOrder(orderId: number): Promise<Message[]> {
    try {
      // Use raw SQL since there's a Drizzle schema issue
      const result = await db.execute(
        sql`
          SELECT id, order_id, sender_id, sender_name, sender_role, content, 
                 message_type, files, is_read, created_at 
          FROM messages 
          WHERE order_id = ${orderId} 
          ORDER BY created_at ASC
        `
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        senderId: row.sender_id,
        senderName: row.sender_name || '',
        senderRole: row.sender_role || 'customer',
        content: row.content,
        messageType: row.message_type || 'text',
        files: row.files,
        isRead: row.is_read,
        createdAt: row.created_at
      })) as Message[];
    } catch (error) {
      console.error('Error getting messages by order:', error);
      return [];
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Get sender info to store in the message
    const sender = await db
      .select({
        name: users.name,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, insertMessage.senderId))
      .limit(1);

    const senderInfo = sender[0];
    
    const [message] = await db
      .insert(messages)
      .values({
        orderId: insertMessage.orderId,
        senderId: insertMessage.senderId,
        senderName: senderInfo?.name || senderInfo?.phone || '',
        senderRole: senderInfo?.role || 'customer',
        content: insertMessage.content,
        messageType: insertMessage.messageType || 'text',
        files: insertMessage.files || null,
        isRead: false,
        createdAt: new Date()
      })
      .returning();

    return message;
  }

  async markMessagesAsRead(orderId: number, userId: number): Promise<void> {
    // Mark messages as read for the viewing user (not the sender)
    // This means marking messages from OTHER users as read when this user views them
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.orderId, orderId),
          ne(messages.senderId, userId) // Mark messages NOT sent by this user as read
        )
      );
  }

  async getShopApplication(id: number): Promise<ShopApplication | undefined> {
    const [application] = await db
      .select()
      .from(shopApplications)
      .where(eq(shopApplications.id, id));
    return application || undefined;
  }

  async getPendingShopApplications(): Promise<ShopApplication[]> {
    return await db
      .select()
      .from(shopApplications)
      .where(eq(shopApplications.status, "pending"))
      .orderBy(desc(shopApplications.createdAt));
  }

  async getAllShopApplications(): Promise<ShopApplication[]> {
    return await db
      .select()
      .from(shopApplications)
      .orderBy(desc(shopApplications.createdAt));
  }

  // Notification operations
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteOrder(id: number, deletedBy?: number): Promise<boolean> {
    try {
      // Soft delete - mark as deleted instead of removing
      const result = await db
        .update(orders)
        .set({
          deletedBy: deletedBy,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  async createShopApplication(insertApplication: InsertShopApplication): Promise<ShopApplication> {
    const [application] = await db
      .insert(shopApplications)
      .values({
        ...insertApplication,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return application;
  }

  async updateShopApplication(id: number, updates: Partial<ShopApplication>): Promise<ShopApplication | undefined> {
    const [application] = await db
      .update(shopApplications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(shopApplications.id, id))
      .returning();
    
    // If shop already exists, sync critical business information
    if (application && application.status === 'approved') {
      await this.syncShopFromApplication(application);
    }
    
    return application || undefined;
  }

  // Sync shop data from application data (bidirectional sync)
  async syncShopFromApplication(application: ShopApplication): Promise<void> {
    try {
      const existingShop = await db
        .select()
        .from(shops)
        .where(eq(shops.ownerId, application.applicantId))
        .limit(1);

      if (existingShop.length > 0) {
        // Update existing shop with application data
        await db
          .update(shops)
          .set({
            // Business Information - Shop owner can change these
            name: application.publicShopName,
            address: application.publicAddress,
            phone: application.publicContactNumber || application.phoneNumber,
            publicOwnerName: application.publicOwnerName,
            email: application.email,
            city: application.city,
            state: application.state,
            pinCode: application.pinCode,
            services: application.services,
            equipment: application.equipment,
            yearsOfExperience: application.yearsOfExperience,
            workingHours: application.workingHours,
            ownerFullName: application.ownerFullName,
            ownerPhone: application.phoneNumber,
            // Keep admin-controlled settings unchanged
            updatedAt: new Date()
          })
          .where(eq(shops.id, existingShop[0].id));
      }
    } catch (error) {
      console.error('Error syncing shop from application:', error);
    }
  }

  // Sync application data from shop data (when shop owner updates settings)
  async syncApplicationFromShop(shopId: number): Promise<void> {
    try {
      const shop = await this.getShop(shopId);
      if (!shop) return;

      const application = await db
        .select()
        .from(shopApplications)
        .where(eq(shopApplications.applicantId, shop.ownerId))
        .limit(1);

      if (application.length > 0) {
        await db
          .update(shopApplications)
          .set({
            // Sync business information only
            publicShopName: shop.name,
            publicAddress: shop.address,
            publicContactNumber: shop.phone,
            publicOwnerName: shop.publicOwnerName,
            email: shop.email,
            city: shop.city,
            state: shop.state,
            pinCode: shop.pinCode,
            services: shop.services,
            equipment: shop.equipment,
            yearsOfExperience: shop.yearsOfExperience,
            workingHours: shop.workingHours,
            ownerFullName: shop.ownerFullName,
            phoneNumber: shop.ownerPhone,
            updatedAt: new Date()
          })
          .where(eq(shopApplications.id, application[0].id));
      }
    } catch (error) {
      console.error('Error syncing application from shop:', error);
    }
  }

  async checkShopSlugAvailability(slug: string): Promise<boolean> {
    const [existingShop] = await db
      .select()
      .from(shops)
      .where(eq(shops.slug, slug));
    
    const [existingApplication] = await db
      .select()
      .from(shopApplications)
      .where(eq(shopApplications.shopSlug, slug));
    
    return !existingShop && !existingApplication;
  }

  async updateShopApplicationStatus(id: number, status: string, adminNotes?: string): Promise<ShopApplication> {
    const [updated] = await db
      .update(shopApplications)
      .set({ status, adminNotes, updatedAt: new Date() })
      .where(eq(shopApplications.id, id))
      .returning();
    return updated;
  }

  async getVisitedShopsByCustomer(customerId: number): Promise<any[]> {
    // Get shops from both orders and unlocked shops for comprehensive view
    const result = await db
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        city: shops.city,
        isOnline: shops.isOnline,
        phone: shops.phone,
        address: shops.address,
        rating: shops.rating,
        status: shops.status,
        isApproved: shops.isApproved
      })
      .from(customerShopUnlocks)
      .innerJoin(shops, eq(customerShopUnlocks.shopId, shops.id))
      .where(and(
        eq(customerShopUnlocks.customerId, customerId),
        eq(shops.status, 'active'),
        eq(shops.isApproved, true)
      ))
      .groupBy(shops.id, shops.name, shops.slug, shops.city, shops.isOnline, shops.phone, shops.address, shops.rating, shops.status, shops.isApproved);
    
    return result;
  }

  async updateShopSettings(shopId: number, settings: any): Promise<any> {
    // Handle JSON fields properly
    const updateData: any = {};
    
    // Only include fields that are actually being updated
    if ('acceptsOrders' in settings) {
      updateData.isOnline = settings.acceptsOrders;
    }
    if ('acceptsWalkinOrders' in settings) {
      updateData.acceptsWalkinOrders = settings.acceptsWalkinOrders;
    }
    if ('autoAvailability' in settings) {
      updateData.autoAvailability = settings.autoAvailability;
    }
    if ('workingHours' in settings && typeof settings.workingHours === 'object') {
      updateData.workingHours = JSON.stringify(settings.workingHours);
    }
    if ('services' in settings && Array.isArray(settings.services)) {
      updateData.services = JSON.stringify(settings.services);
    }
    if ('equipment' in settings && Array.isArray(settings.equipment)) {
      updateData.equipment = JSON.stringify(settings.equipment);
    }
    
    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      const [existingShop] = await db.select().from(shops).where(eq(shops.id, shopId));
      return existingShop;
    }
    
    const [updated] = await db
      .update(shops)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(shops.id, shopId))
      .returning();
    return updated;
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    activeShops: number;
    totalOrders: number;
  }> {
    // Count ALL active users regardless of role
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    // Count ALL approved shops regardless of online status
    const [shopCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shops)
      .where(eq(shops.isApproved, true));

    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    return {
      totalUsers: userCount.count,
      activeShops: shopCount.count,
      totalOrders: orderCount.count,
    };
  }



  async updateShopStatus(shopId: number, status: 'active' | 'deactivated' | 'banned'): Promise<void> {
    await db.update(shops).set({ 
      status,
      updatedAt: new Date() 
    }).where(eq(shops.id, shopId));
  }

  async deleteShop(shopId: number): Promise<void> {
    await db.delete(shops).where(eq(shops.id, shopId));
  }

  async deleteOrderFiles(orderId: number): Promise<void> {
    // Get the order to access file information
    const order = await this.getOrder(orderId);
    
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Delete order files
      if (order && order.files) {
        const files = typeof order.files === 'string' ? JSON.parse(order.files) : order.files;
        
        for (const file of files) {
          try {
            const filename = file.filename || file.path;
            if (filename) {
              const filePath = path.join(uploadDir, filename);
              
              // Check if file exists before attempting to delete
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted order file: ${filename} for completed order ${orderId}`);
              }
            }
          } catch (error) {
            console.error(`Error deleting order file ${file.filename} for order ${orderId}:`, error);
            // Continue deleting other files even if one fails
          }
        }
      }

      // Delete chat message files
      const messages = await this.getMessagesByOrder(orderId);
      for (const message of messages) {
        if (message.files) {
          try {
            const chatFiles = JSON.parse(message.files);
            if (Array.isArray(chatFiles)) {
              for (const fileData of chatFiles) {
                // Handle both old format (filename string) and new format (file object)
                const filename = typeof fileData === 'string' ? fileData : fileData.filename;
                if (filename) {
                  const filePath = path.join(uploadDir, filename);
                  if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted chat file: ${filename} for completed order ${orderId}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Failed to process chat files for message ${message.id}:`, error);
          }
        }
      }

      // Clear files data from database to save space
      await db.update(orders)
        .set({ files: null })
        .where(eq(orders.id, orderId));

      // Clear chat files references using raw SQL to avoid schema issues
      await db.execute(
        sql`UPDATE messages SET files = NULL WHERE order_id = ${orderId}`
      );
        
      console.log(`All files deleted for completed order ${orderId} - memory optimized`);
    } catch (error) {
      console.error(`Error processing file deletion for order ${orderId}:`, error);
    }
  }

  // Helper method to hash passwords
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Helper method to verify passwords
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Customer shop unlock operations
  async unlockShopForCustomer(customerId: number, shopId: number, qrScanLocation?: string): Promise<{ shopId: number; shopName: string }> {
    // Check if shop exists and is active
    const shop = await this.getShop(shopId);
    if (!shop || !shop.isApproved || shop.status !== 'active') {
      throw new Error('Shop not found or not available');
    }

    // Check if already unlocked
    const isAlreadyUnlocked = await this.isShopUnlockedForCustomer(customerId, shopId);
    if (isAlreadyUnlocked) {
      return { shopId, shopName: shop.name };
    }

    // Insert new unlock record using Drizzle
    await db.insert(customerShopUnlocks).values({
      customerId,
      shopId,
      qrScanLocation: qrScanLocation || 'unknown'
    }).onConflictDoNothing();

    return { shopId, shopName: shop.name };
  }

  async getUnlockedShopsByCustomer(customerId: number): Promise<number[]> {
    const result = await db
      .select({ shopId: customerShopUnlocks.shopId })
      .from(customerShopUnlocks)
      .where(eq(customerShopUnlocks.customerId, customerId));
    
    return result.map(row => row.shopId);
  }

  async isShopUnlockedForCustomer(customerId: number, shopId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(customerShopUnlocks)
      .where(and(eq(customerShopUnlocks.customerId, customerId), eq(customerShopUnlocks.shopId, shopId)))
      .limit(1);
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
