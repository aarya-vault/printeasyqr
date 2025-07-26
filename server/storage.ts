import { 
  users, shops, orders, messages, shopApplications, notifications,
  type User, type InsertUser, type Shop, type InsertShop, 
  type Order, type InsertOrder, type Message, type InsertMessage,
  type ShopApplication, type InsertShopApplication, type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Shop operations
  getShop(id: number): Promise<Shop | undefined>;
  getShopsByOwner(ownerId: number): Promise<Shop[]>;
  getActiveShops(): Promise<Shop[]>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: number, updates: Partial<Shop>): Promise<Shop | undefined>;
  getShopBySlug(slug: string): Promise<Shop | undefined>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByShop(shopId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  
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
      .values([insertShop])
      .returning();
    return shop;
  }

  async updateShop(id: number, updates: Partial<Shop>): Promise<Shop | undefined> {
    const [shop] = await db
      .update(shops)
      .set({
        ...updates,
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
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByShop(shopId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .orderBy(desc(orders.createdAt));
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
    return await db
      .select()
      .from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
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
    // Handle working hours properly
    const updateData: any = { ...settings };
    if (settings.workingHours && typeof settings.workingHours === 'object') {
      updateData.workingHours = JSON.stringify(settings.workingHours);
    }
    if (settings.services && Array.isArray(settings.services)) {
      updateData.services = JSON.stringify(settings.services);
    }
    if (settings.equipment && Array.isArray(settings.equipment)) {
      updateData.equipment = JSON.stringify(settings.equipment);
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
}

export const storage = new DatabaseStorage();
