import { 
  users, shops, orders, messages, shopApplications, notifications,
  type User, type InsertUser, type Shop, type InsertShop, 
  type Order, type InsertOrder, type Message, type InsertMessage,
  type ShopApplication, type InsertShopApplication, type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
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
    const [shop] = await db.select().from(shops).where(eq(shops.ownerId, ownerId));
    return shop || undefined;
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
    return shop || undefined;
  }

  async getShopBySlug(slug: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.slug, slug));
    return shop || undefined;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    const orderList = await db
      .select({
        order: orders,
        shop: {
          id: shops.id,
          name: shops.name,
          phone: shops.phone,
          city: shops.city,
        }
      })
      .from(orders)
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    return orderList.map(row => ({
      ...row.order,
      shop: row.shop
    })) as Order[];
  }

  async getOrdersByShop(shopId: number): Promise<Order[]> {
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
      .where(eq(orders.shopId, shopId))
      .orderBy(desc(orders.createdAt));

    return orderList.map(row => ({
      ...row.order,
      customerName: row.customer?.name || '',
      customerPhone: row.customer?.phone || '',
    })) as Order[];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...insertOrder,
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
                 message_type, file_url, file_name, is_read, created_at 
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
        files: row.file_url || row.file_name || null,
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
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.orderId, orderId),
          eq(messages.senderId, userId)
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

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
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
    return application || undefined;
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
    const result = await db
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        city: shops.city,
        isOnline: shops.isOnline,
        phone: shops.phone,
      })
      .from(orders)
      .innerJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.customerId, customerId))
      .groupBy(shops.id, shops.name, shops.slug, shops.city, shops.isOnline, shops.phone);
    
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
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "customer"));

    const [shopCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shops)
      .where(and(eq(shops.isApproved, true), eq(shops.isOnline, true)));

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
              for (const filename of chatFiles) {
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted chat file: ${filename} for completed order ${orderId}`);
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

      // Clear chat files references
      await db.update(messages)
        .set({ files: null })
        .where(eq(messages.orderId, orderId));
        
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
}

export const storage = new DatabaseStorage();
